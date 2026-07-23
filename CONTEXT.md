# Alanya Holidays — Ubiquitous Language & Domain Model

This document captures the domain model and ubiquitous language for the **Alanya Holidays** platform.

## Core Concepts & Domain Terminology

### 1. Property Listing (Недвижимость и жильё)
Verified holiday rental listings located across Alanya's districts (e.g., Mahmutlar, Oba, Cleopatra, Kargicak).
- **Host**: Property owner listing rentals on zero-commission direct booking terms.
- **Guest**: Traveler exploring or reserving rentals.
- **Availability Calendar**: Host calendar defining nightly prices, blockouts, and seasonal rates.

### 2. District Directory (Справочник мест и услуг)
Curated directory of local businesses, attractions, services, and consultants.
- **Listing Addon**: Paid promotional badge or placement boost for directory entries.
- **Claimed Listing**: Business owner verification of a directory entry.

### 3. Booking Request & Workflow (Бронирование)
Direct guest booking flow without commission markup.
- **Pending Booking**: Guest inquiry awaiting host confirmation or payment.
- **Confirmed Booking**: Active reservation with payment/deposit verified.
- **Cancelled / Expired Booking**: Reservation released manually or by automated cron cleanup.

### 4. Subscription & Checkout (Подписки и Платежи)
Stripe-integrated monetization for host premium profiles and listing upgrades.
- **Host Subscription**: Recurring membership granting enhanced listing capacity.
- **Checkout Session**: Stripe Session handling subscription or one-time addon payment.

### 5. AI Local Guide (ИИ Гид и Планировщик)
Interactive AI assistant (Gemini model) providing itineraries, district tips, and trip recommendations in multi-languages (EN, RU, TR).

### 6. Edge Gateway & Proxy (Маршрутизация и Единая Точка Входа)
Nginx reverse proxy coordinating frontend SPA static delivery, NestJS API proxying, and Supabase Edge Functions proxying.
