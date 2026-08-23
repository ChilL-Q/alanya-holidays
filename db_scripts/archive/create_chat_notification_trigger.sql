-- Create a function to handle new chat messages
CREATE OR REPLACE FUNCTION handle_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id uuid;
  v_sender_name text;
  v_guest_id uuid;
  v_host_id uuid;
BEGIN
  -- Get conversation details
  SELECT guest_id, host_id INTO v_guest_id, v_host_id
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Determine recipient (the one who didn't send the message)
  IF NEW.sender_id = v_guest_id THEN
    v_recipient_id := v_host_id;
  ELSE
    v_recipient_id := v_guest_id;
  END IF;

  -- Get sender profile details (optional, for better message)
  -- SELECT full_name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;

  -- Insert notification for the recipient
  INSERT INTO notifications (user_id, type, title, message, link, read)
  VALUES (
    v_recipient_id,
    'booking_request', -- or 'message'
    'New Message',
    'New message: ' || substring(NEW.content from 1 for 30) || CASE WHEN length(NEW.content) > 30 THEN '...' ELSE '' END,
    '/host/messages', -- or specific link
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on new chat messages
DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;
CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_chat_message();
