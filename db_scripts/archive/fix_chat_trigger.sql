-- Fixed Trigger: Uses 'info' type to avoid Enum error
CREATE OR REPLACE FUNCTION handle_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id uuid;
  v_guest_id uuid;
  v_host_id uuid;
BEGIN
  -- Get conversation details
  SELECT guest_id, host_id INTO v_guest_id, v_host_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Determine recipient
  IF NEW.sender_id = v_guest_id THEN
    v_recipient_id := v_host_id;
  ELSE
    v_recipient_id := v_guest_id;
  END IF;

  -- Safely Insert Notification (using valid 'info' type)
  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (
      v_recipient_id,
      'info', -- FIXED: 'booking_request' was invalid
      'New Message',
      'New message: ' || substring(NEW.content from 1 for 30) || CASE WHEN length(NEW.content) > 30 THEN '...' ELSE '' END,
      '/host/messages',
      false
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Prevent message sending failure even if notification fails
  RAISE WARNING 'Notification trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_chat_message();
