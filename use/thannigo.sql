-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 15, 2026 at 12:48 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `thannigo`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(30) NOT NULL DEFAULT 'Home',
  `recipient_name` varchar(100) DEFAULT NULL,
  `address_line1` varchar(255) NOT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `floor_number` smallint(6) DEFAULT NULL,
  `gate_code` varchar(20) DEFAULT NULL,
  `delivery_instructions` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `label`, `recipient_name`, `address_line1`, `address_line2`, `city`, `pincode`, `latitude`, `longitude`, `floor_number`, `gate_code`, `delivery_instructions`, `is_default`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 3, 'Personal ', '', 'Kumarasamy Street, Chromepet, Pallavaram', NULL, 'Default', '000000', 12.9569782, 80.1336066, NULL, NULL, '', 0, 0, '2026-04-14 00:21:47', '2026-04-14 09:17:02'),
(2, 3, 'Office', 'Mslabs', 'CLC Works Road, Chromepet, Pallavaram', NULL, 'Default', '000000', 12.9544487, 80.1384810, NULL, NULL, '', 0, 0, '2026-04-14 00:26:38', '2026-04-14 09:17:02'),
(3, 3, 'Home', '', 'Keelkattalai, Pallavaram', NULL, 'Default', '000000', 12.9641717, 80.1796521, NULL, NULL, '', 0, 0, '2026-04-14 00:29:21', '2026-04-14 09:17:02'),
(4, 3, 'Wife office', '', 'Pallavaram Flyover, Pallavaram, Pallavaram', NULL, 'Default', '000000', 12.9593151, 80.1461477, NULL, NULL, '', 0, 0, '2026-04-14 00:29:50', '2026-04-14 09:17:02'),
(5, 3, 'Home', 'Ugendran', 'Chromepet, Pallavaram, Chengalpattu, Tamil Nadu, 600044, India', NULL, 'Default', '000000', 12.9536776, 80.1277005, NULL, NULL, '', 1, 1, '2026-04-14 00:49:27', '2026-04-14 09:17:02'),
(6, 3, 'Office', 'Mslabs', 'Pallavaram, Pallavaram', NULL, 'Default', '000000', 12.9624935, 80.1409159, NULL, NULL, '', 0, 1, '2026-04-14 00:49:45', '2026-04-14 09:17:02'),
(7, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:27:20', '2026-04-14 14:27:20'),
(8, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:27:53', '2026-04-14 14:27:53'),
(9, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:29:59', '2026-04-14 14:29:59'),
(10, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:30:01', '2026-04-14 14:30:01'),
(11, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:30:19', '2026-04-14 14:30:19'),
(12, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:31:25', '2026-04-14 14:31:25'),
(13, 7, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:32:02', '2026-04-14 14:32:02'),
(14, 8, 'Home', NULL, '6/7 , Chromepet', NULL, 'Default', '000000', 12.9535895, 80.1276133, NULL, NULL, NULL, 1, 1, '2026-04-14 14:40:19', '2026-04-14 14:40:19'),
(15, 9, 'Home', NULL, '2/9 1st Pillayar Koil Street, Chromepet', NULL, 'Default', '000000', 12.9536794, 80.1276948, NULL, NULL, NULL, 1, 1, '2026-04-15 00:06:19', '2026-04-15 00:06:19');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_ta` varchar(100) NOT NULL,
  `image_url` varchar(2048) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name_en`, `name_ta`, `image_url`, `is_active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Cans (Returnable)', 'கேன் தண்ணீர்', NULL, 1, 1, '2026-04-13 23:20:45', '2026-04-13 23:20:45'),
(2, 'Bottled Water (Packs)', 'பாட்டில் தண்ணீர்', NULL, 1, 2, '2026-04-13 23:20:45', '2026-04-13 23:20:45'),
(3, 'Dispensers & Equipment', 'சாதனங்கள்', NULL, 1, 3, '2026-04-13 23:20:45', '2026-04-13 23:20:45'),
(4, 'Commercial & Bulk', 'வணிக மற்றும் மொத்த விற்பனை', NULL, 1, 4, '2026-04-13 23:20:45', '2026-04-14 11:08:09');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(30) NOT NULL COMMENT 'late | wrong_order | quality | rude | missing_items | other',
  `description` text NOT NULL,
  `photo_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photo_urls`)),
  `status` varchar(20) NOT NULL DEFAULT 'open' COMMENT 'open | in_progress | resolved | closed',
  `priority` varchar(10) NOT NULL DEFAULT 'normal' COMMENT 'low | normal | high | urgent',
  `resolution_type` varchar(30) DEFAULT NULL COMMENT 'refund | replacement | apology | no_action',
  `resolution_notes` text DEFAULT NULL,
  `resolved_by` bigint(20) UNSIGNED DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `is_sos` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'True for urgent SOS complaints requiring immediate admin attention',
  `issue_type` varchar(40) DEFAULT NULL COMMENT 'late_delivery | bad_quality | damage_leak | extra_money | wrong_item | no_delivery',
  `admin_action` varchar(20) DEFAULT NULL COMMENT 'pending_review | approved | rejected | escalated',
  `admin_notes` text DEFAULT NULL,
  `admin_reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `admin_reviewed_at` datetime DEFAULT NULL,
  `replacement_order_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Linked replacement order if admin approved replacement',
  `refund_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Linked refund record if admin approved refund',
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(20) NOT NULL,
  `shop_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` varchar(20) NOT NULL COMMENT 'percentage | fixed | free_delivery | bogo',
  `discount_value` decimal(8,2) NOT NULL,
  `max_discount` decimal(8,2) DEFAULT NULL,
  `min_order_value` decimal(8,2) NOT NULL DEFAULT 0.00,
  `max_uses` int(11) DEFAULT NULL,
  `max_uses_per_user` int(11) DEFAULT 1,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'If set, this coupon is exclusive to this user',
  `issuer_type` enum('admin','shop') NOT NULL DEFAULT 'shop' COMMENT 'admin coupons don''t reduce shop payout',
  `loyalty_level` int(11) DEFAULT NULL COMMENT 'Which level triggered this coupon'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `code`, `shop_id`, `type`, `discount_value`, `max_discount`, `min_order_value`, `max_uses`, `max_uses_per_user`, `used_count`, `valid_from`, `valid_until`, `is_active`, `created_at`, `user_id`, `issuer_type`, `loyalty_level`) VALUES
(1, 'TEST', 2, 'percentage', 20.00, NULL, 200.00, 100, 1, 0, '2026-04-14 11:52:15', '2026-05-30 11:51:00', 1, '2026-04-14 11:52:15', NULL, 'shop', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usage`
--

CREATE TABLE `coupon_usage` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `coupon_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `used_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_assignments`
--

CREATE TABLE `delivery_assignments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `delivery_person_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `assigned_at` datetime NOT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `delivery_time_min` smallint(6) DEFAULT NULL,
  `proof_photo_url` varchar(2048) DEFAULT NULL,
  `failed_reason` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'assigned' COMMENT 'assigned | picked_up | delivered | failed',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_persons`
--

CREATE TABLE `delivery_persons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED DEFAULT NULL,
  `employee_code` varchar(20) DEFAULT NULL,
  `vehicle_type` varchar(20) DEFAULT NULL COMMENT 'bicycle | motorcycle | auto | van',
  `vehicle_number` varchar(15) DEFAULT NULL,
  `current_latitude` decimal(10,7) DEFAULT NULL,
  `current_longitude` decimal(10,7) DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `is_on_duty` tinyint(1) NOT NULL DEFAULT 0,
  `total_deliveries` int(11) NOT NULL DEFAULT 0,
  `avg_delivery_time_min` decimal(5,1) NOT NULL DEFAULT 0.0,
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | suspended',
  `profile_photo_url` varchar(2048) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `name_ta` varchar(150) DEFAULT NULL,
  `code` varchar(50) DEFAULT NULL,
  `path` varchar(255) DEFAULT NULL,
  `extensions` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_on` datetime DEFAULT NULL,
  `created_ip` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `features_master`
--

CREATE TABLE `features_master` (
  `id` int(10) UNSIGNED NOT NULL,
  `key` varchar(80) NOT NULL COMMENT 'Snake-case key e.g. instant_payout, free_delivery, priority_listing',
  `name` varchar(100) NOT NULL COMMENT 'Human-readable name',
  `description` text DEFAULT NULL,
  `role` varchar(20) NOT NULL COMMENT 'customer | shop_owner | both | admin',
  `is_free` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'If true, available to everyone regardless of plan',
  `pricing_type` varchar(20) NOT NULL DEFAULT 'free' COMMENT 'free | subscription | usage | one_time',
  `price_per_use` decimal(8,2) DEFAULT NULL COMMENT 'Charged per use if pricing_type=usage',
  `default_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Default state for all users (can be overridden per user/plan)',
  `globally_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Admin master toggle — if false, feature is disabled for everyone',
  `category` varchar(40) DEFAULT NULL COMMENT 'delivery | payment | analytics | listing | loyalty | support',
  `is_beta` tinyint(1) NOT NULL DEFAULT 0,
  `deprecation_notice` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feature_overrides`
--

CREATE TABLE `feature_overrides` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `feature_id` int(10) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'If set, override applies to this user',
  `shop_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'If set, override applies to this shop',
  `is_enabled` tinyint(1) NOT NULL COMMENT 'true = force enable, false = force disable',
  `reason` varchar(255) DEFAULT NULL COMMENT 'Admin note explaining the override',
  `expires_at` datetime DEFAULT NULL COMMENT 'Null = permanent override',
  `created_by` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Admin user who created this override',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `generated_slots`
--

CREATE TABLE `generated_slots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_orders` int(11) NOT NULL DEFAULT 50,
  `booked_orders` int(11) NOT NULL DEFAULT 0,
  `is_full` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `full_cans` int(11) NOT NULL DEFAULT 0,
  `empty_cans` int(11) NOT NULL DEFAULT 0,
  `damaged_cans` int(11) NOT NULL DEFAULT 0,
  `low_stock_alert` int(11) NOT NULL DEFAULT 10,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `change_type` varchar(30) NOT NULL COMMENT 'purchase | sale | damage | return | adjustment | opening_stock',
  `quantity_change` int(11) NOT NULL,
  `quantity_before` int(11) NOT NULL,
  `quantity_after` int(11) NOT NULL,
  `reference_type` varchar(30) DEFAULT NULL COMMENT 'order | purchase | manual | damage',
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_levels`
--

CREATE TABLE `loyalty_levels` (
  `id` int(10) UNSIGNED NOT NULL,
  `level_number` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `min_points` int(11) NOT NULL,
  `max_points` int(11) NOT NULL,
  `discount_percent` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loyalty_levels`
--

INSERT INTO `loyalty_levels` (`id`, `level_number`, `name`, `min_points`, `max_points`, `discount_percent`, `status`, `created_at`, `updated_at`) VALUES
(41, 1, 'Level 1', 0, 99, 0, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(42, 2, 'Level 2', 100, 199, 0, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(43, 3, 'Level 3', 200, 299, 2, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(44, 4, 'Level 4', 300, 499, 2, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(45, 5, 'Level 5', 500, 699, 5, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(46, 6, 'Level 6', 700, 1049, 5, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(47, 7, 'Level 7', 1050, 1499, 8, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49'),
(48, 8, 'Level 8', 1500, 999999, 10, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_points`
--

CREATE TABLE `loyalty_points` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` varchar(20) NOT NULL COMMENT 'earn | redeem | expire | adjust',
  `points` int(11) NOT NULL,
  `balance_after` int(11) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `source` varchar(30) NOT NULL DEFAULT 'order' COMMENT 'order | referral | bonus | adjust | redeem',
  `reference_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'id of order or referral reward that generated these points',
  `loyalty_type` enum('admin','shop') NOT NULL DEFAULT 'admin' COMMENT 'Determines who funds the reward: platform (admin) or merchant (shop)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loyalty_points`
--

INSERT INTO `loyalty_points` (`id`, `user_id`, `order_id`, `type`, `points`, `balance_after`, `description`, `expires_at`, `created_at`, `source`, `reference_id`, `loyalty_type`) VALUES
(1, 4, NULL, 'earn', 20, 20, 'Referral Bonus: SIGNUP', NULL, '2026-04-14 13:10:49', 'referral', 1, 'admin');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_settings`
--

CREATE TABLE `loyalty_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `points_to_currency_ratio` int(11) NOT NULL DEFAULT 10 COMMENT 'Mapping: 10 points = ₹1',
  `min_order_amount_for_redeem` decimal(10,2) NOT NULL DEFAULT 100.00,
  `max_points_percentage_per_order` int(11) NOT NULL DEFAULT 10 COMMENT 'Max percentage of order value that can be covered by points',
  `max_points_per_order` int(11) NOT NULL DEFAULT 100,
  `earn_points_per_rupee` float NOT NULL DEFAULT 1 COMMENT '₹1 = 1 Point',
  `points_expiry_days` int(11) NOT NULL DEFAULT 90,
  `max_points_earn_per_day` int(11) NOT NULL DEFAULT 500,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `new_shop_bonus_points` int(11) NOT NULL DEFAULT 20 COMMENT 'Bonus awarded for the first order ever placed at a specific shop',
  `repeat_order_bonus_percentage` int(11) NOT NULL DEFAULT 5 COMMENT 'Extra percentage multiplier for points earned after 5+ orders at a shop'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `loyalty_settings`
--

INSERT INTO `loyalty_settings` (`id`, `points_to_currency_ratio`, `min_order_amount_for_redeem`, `max_points_percentage_per_order`, `max_points_per_order`, `earn_points_per_rupee`, `points_expiry_days`, `max_points_earn_per_day`, `status`, `created_at`, `updated_at`, `new_shop_bonus_points`, `repeat_order_bonus_percentage`) VALUES
(1, 10, 100.00, 10, 100, 1, 90, 500, 'active', '2026-04-14 11:57:49', '2026-04-14 11:57:49', 20, 5);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL COMMENT 'order_placed|accepted|delivered|low_stock|promo|etc.',
  `title` varchar(100) NOT NULL,
  `body` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `channel` varchar(20) NOT NULL DEFAULT 'push',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `delivery_person_id` bigint(20) UNSIGNED DEFAULT NULL,
  `order_number` varchar(20) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'placed' COMMENT 'placed|accepted|preparing|dispatched|delivered|cancelled|failed',
  `type` enum('instant','scheduled','emergency','subscription') NOT NULL DEFAULT 'instant',
  `total_amount` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `delivery_charge` decimal(8,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `payment_status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | paid | failed | refunded',
  `coupon_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subscription_id` bigint(20) UNSIGNED DEFAULT NULL,
  `delivery_notes` text DEFAULT NULL,
  `cancel_reason` varchar(200) DEFAULT NULL,
  `proof_photo_url` varchar(2048) DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `dispatched_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `scheduled_for` datetime DEFAULT NULL,
  `reschedule_at` datetime DEFAULT NULL,
  `is_emergency` tinyint(1) NOT NULL DEFAULT 0,
  `is_contactless` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `admin_discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Platform funded discount (not deducted from shop payout)',
  `shop_discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Merchant funded discount (deducted from shop payout)',
  `scheduled_date` date DEFAULT NULL,
  `slot_id` bigint(20) UNSIGNED DEFAULT NULL,
  `delivery_time` time DEFAULT NULL COMMENT 'Actual or expected time of delivery'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(8,2) NOT NULL,
  `deposit_per_can` decimal(8,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_status_logs`
--

CREATE TABLE `order_status_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `from_status` varchar(30) DEFAULT NULL,
  `to_status` varchar(30) NOT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `otp_logs`
--

CREATE TABLE `otp_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `phone` varchar(15) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `action` varchar(30) NOT NULL COMMENT 'login | register | reset_pin',
  `status` varchar(20) NOT NULL DEFAULT 'sent' COMMENT 'sent | verified | expired | failed',
  `ip_address` varchar(45) DEFAULT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `otp_message` varchar(255) DEFAULT NULL COMMENT 'The actual message text sent via SMS'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `otp_logs`
--

INSERT INTO `otp_logs` (`id`, `phone`, `otp_hash`, `action`, `status`, `ip_address`, `device_id`, `expires_at`, `created_at`, `otp_message`) VALUES
(1, '+918428882777', '$2b$10$8eXsT.iA9cOO.YuBy1XfieqwADs8JjbpVUteo/j0lz8z4l7g6Dso6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 22:57:47', '2026-04-13 22:52:47', 'Your ThanniGo OTP is 920803. Valid for 5 minutes.'),
(2, '+919025815982', '$2b$10$9XGMnfebhKB0ssP03rmym.BEtjAwyRLR/lHVntAzlg5/EAcbBZCEK', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:15:04', '2026-04-13 23:10:04', 'Your ThanniGo OTP is 261267. Valid for 5 minutes.'),
(3, '+919025815982', '$2b$10$SRiYisWnQJGV1jPZURe6duASym1DzQA.vLHF31qbx/ZKtCV/a3Jve', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:15:51', '2026-04-13 23:10:51', 'Your ThanniGo OTP is 818532. Valid for 5 minutes.'),
(4, '+918428882777', '$2b$10$2RvOL/eMB1jfB6Z11.LU5u8mygaytteAB5u2HxxPjT.l/8EUe3YeO', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:23:31', '2026-04-13 23:18:31', 'Your ThanniGo OTP is 333539. Valid for 5 minutes.'),
(5, '+918428882777', '$2b$10$LuhbDvpxVwZywsnQ0IuQu.fJ5NqNEszzRM0igx73snJffb7OnksH.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:31:14', '2026-04-13 23:26:14', 'Your ThanniGo OTP is 709758. Valid for 5 minutes.'),
(6, '+918428882777', '$2b$10$AFg93qT3emjZLCI3rfPhq.RITyhHwGKA/L53PnC3JMHG1k/JMPTwm', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:32:38', '2026-04-13 23:27:38', 'Your ThanniGo OTP is 828008. Valid for 5 minutes.'),
(7, '+919025815982', '$2b$10$zUDLNG00UXqroleA3d4J0OgEoxIb.dKTyEVI31LL5JY1rGBO0ayZi', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:33:42', '2026-04-13 23:28:42', 'Your ThanniGo OTP is 355800. Valid for 5 minutes.'),
(8, '+919025815982', '$2b$10$v9ltgn.0QJZK8KRA8McwkO1Z7gwVu/CvreCoy8T.WT7nE668Ou.A.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-13 23:52:13', '2026-04-13 23:47:13', 'Your ThanniGo OTP is 251497. Valid for 5 minutes.'),
(9, '+918428882777', '$2b$10$OMMCcaSVdUsULfoTurCGCOBgk3mEEJEH33.5POnAj7Zr6sbwxJDee', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:08:41', '2026-04-14 00:03:41', 'Your ThanniGo OTP is 277558. Valid for 5 minutes.'),
(10, '+919025815982', '$2b$10$dAIZPvTVMYkRN8v4me4yg.4H2al1rQK8xfzHdVIMn63MHa6Rt5vx6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:10:21', '2026-04-14 00:05:21', 'Your ThanniGo OTP is 546378. Valid for 5 minutes.'),
(11, '+918428882777', '$2b$10$NwBc3sP16L9eec32jgxco.ropwvnHIyQdoWBJKiqwB1JMwGnatYH2', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:15:29', '2026-04-14 00:10:29', 'Your ThanniGo OTP is 460367. Valid for 5 minutes.'),
(12, '+919876543210', '$2b$10$9kBrsg3FnAH8MXgoj/INjeFEBWdOHRI6tK3HwRZtN23IcC8/qYEX.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:16:14', '2026-04-14 00:11:14', 'Your ThanniGo OTP is 312417. Valid for 5 minutes.'),
(13, '+916384548477', '$2b$10$daSPKjqU3fQqZBIQd.w0RuU0uu35Rjczs.qIpToHmXdJqeulIM5v2', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:22:01', '2026-04-14 00:17:01', 'Your ThanniGo OTP is 262658. Valid for 5 minutes.'),
(14, '+919876543210', '$2b$10$/vXGznb8pBDtga5VQX353ufhF5JTrGJrYlHNuO6IH3THY7m9aFd56', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:25:21', '2026-04-14 00:20:21', 'Your ThanniGo OTP is 868516. Valid for 5 minutes.'),
(15, '+919876543210', '$2b$10$eqHZ7naf8/Nc59m/MrvocOh8RtSf/zcWNPjEv0KCRGYzmh6DzYn7.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:27:15', '2026-04-14 00:22:15', 'Your ThanniGo OTP is 198404. Valid for 5 minutes.'),
(16, '+919876543210', '$2b$10$N2IQsUn4Bro3WdDr6zv0cu4HfWdjTGeMNnpakBvEQlKW5yeVEyVtu', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:29:33', '2026-04-14 00:24:33', 'Your ThanniGo OTP is 652723. Valid for 5 minutes.'),
(17, '+918428882777', '$2b$10$1rVgkkTLLdfI3TEeHiemjeg.0jFBNlmSVqiDQCtHOEKy9iZryj2uS', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:52:47', '2026-04-14 00:47:47', 'Your ThanniGo OTP is 675579. Valid for 5 minutes.'),
(18, '+919876543210', '$2b$10$AXfYzYQCxLGbedk7VzzxwuOkqI5kVFfUoBFR1a5ym7imuCI2hxlta', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:53:04', '2026-04-14 00:48:04', 'Your ThanniGo OTP is 243858. Valid for 5 minutes.'),
(19, '+919876543210', '$2b$10$4kLEBAofEFDTy5/IAyBHae3Q1rTK47q5vVNnLqaQK6mUkGay5eXrq', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:53:36', '2026-04-14 00:48:36', 'Your ThanniGo OTP is 178051. Valid for 5 minutes.'),
(20, '+916384548477', '$2b$10$I8TFZMSJ/C6gvjV34ToDVe5SHSAedwt9Fq9fBpKlSAii6JIn9v5/W', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 00:55:58', '2026-04-14 00:50:58', 'Your ThanniGo OTP is 692602. Valid for 5 minutes.'),
(21, '+916384548477', '$2b$10$zhOah1KFpXub5i1Ef2XWDOW6KKRamlTSG18usdczj1zT7M/yYTq1e', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:14:46', '2026-04-14 01:09:46', 'Your ThanniGo OTP is 278749. Valid for 5 minutes.'),
(22, '+916384548477', '$2b$10$t.hWnQS1il10M6ATQs8gLe3ktOW4PmM8eUAu.v7sm7urn61wKJbf6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:15:26', '2026-04-14 01:10:26', 'Your ThanniGo OTP is 424302. Valid for 5 minutes.'),
(23, '+919025815982', '$2b$10$RU8Rh3n2athnRxUGDS.o7e9byPxbLU6h42cmbgXw2VV6OSoqfBsSi', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:24:21', '2026-04-14 01:19:21', 'Your ThanniGo OTP is 159668. Valid for 5 minutes.'),
(24, '+916384548477', '$2b$10$RbJKkbuHHyOoHozXXemmvORHv.a8W.RP3fr3xQcOUsmwV0/jO7REK', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:25:54', '2026-04-14 01:20:54', 'Your ThanniGo OTP is 522424. Valid for 5 minutes.'),
(25, '+919025815982', '$2b$10$T94bIRlJapu9Mx6AC8JN3OvDyoZQdP9s79C6zQQKTVr2K057i7bam', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:28:41', '2026-04-14 01:23:41', 'Your ThanniGo OTP is 191772. Valid for 5 minutes.'),
(26, '+919818181818', '$2b$10$Ax6/u.d4Blgwgt5i1igKTuBbvLBOPmfnA7gXW5uQ1n8ioShekZlYS', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:30:47', '2026-04-14 01:25:47', 'Your ThanniGo OTP is 618765. Valid for 5 minutes.'),
(27, '+919025815982', '$2b$10$d03fsf6wG2DFEs9PBU0WleY8pk1HTsbf175mykjrRX5HOz2edyeI6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 01:33:58', '2026-04-14 01:28:58', 'Your ThanniGo OTP is 954953. Valid for 5 minutes.'),
(28, '+919876543210', '$2b$10$DGgxX21ODYY3r04FYY5J5ewAlC1K.NMtVUemct2Vtk5OQpPpDRgUS', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 09:12:09', '2026-04-14 09:07:09', 'Your ThanniGo OTP is 255197. Valid for 5 minutes.'),
(29, '+918428882777', '$2b$10$pl62lSxwfwbCD3.sfTl9SutWfeK1kEhPLUVuWw5K4houxwVxWO4ri', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 09:24:08', '2026-04-14 09:19:08', 'Your ThanniGo OTP is 378034. Valid for 5 minutes.'),
(30, '+919025815982', '$2b$10$XM2XVussGRePoUO/CUbqZempEOplf4KD9eVnWrYvhFvfgebky0y8W', 'login', 'sent', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 09:31:57', '2026-04-14 09:26:57', 'Your ThanniGo OTP is 954492. Valid for 5 minutes.'),
(31, '+919025815982', '$2b$10$/N1Q7k2C1s8hpVowxeKlvuYNcl0XxDZqFlLR..fduBk0c5pJ2N6BW', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 09:32:38', '2026-04-14 09:27:38', 'Your ThanniGo OTP is 297678. Valid for 5 minutes.'),
(32, '+918428882777', '$2b$10$Y0KvlUa/lEGAFXqJTh.jaeIo0Z0/.S0WQal3t0qL6OmsxPAOq36x.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 09:39:58', '2026-04-14 09:34:58', 'Your ThanniGo OTP is 172171. Valid for 5 minutes.'),
(33, '+919818181818', '$2b$10$VJ2ldi0uqQGg/CvdEYOJweBPicLZ2Fnu9ennxtlXlJMa9H4wSjMyi', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 09:41:35', '2026-04-14 09:36:35', 'Your ThanniGo OTP is 421826. Valid for 5 minutes.'),
(34, '+918428882777', '$2b$10$yCSFoYZ1Cgvxv0n7jsOM8OzesTwahuMhcYB.6nEZmN6GssX7szE9O', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 09:58:41', '2026-04-14 09:53:41', 'Your ThanniGo OTP is 457842. Valid for 5 minutes.'),
(35, '+918428882777', '$2b$10$/zSjwxsA5FCHxtbL0.ZTPO7GbS3HUDLG/jrUc21y46NmaS6vdsyfe', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:17:02', '2026-04-14 10:12:02', 'Your ThanniGo OTP is 479383. Valid for 5 minutes.'),
(36, '+919025815982', '$2b$10$STqcIhbUJGblWo7jhMJl1uFISy9fDihV573ldwdipO2VdpOOkKIgC', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 10:27:20', '2026-04-14 10:22:20', 'Your ThanniGo OTP is 383628. Valid for 5 minutes.'),
(37, '+919025815982', '$2b$10$n/PSWGOi1S9sILp4XtjZweLWwRaqxY1ShIAyGJYNcKRrUlCnXQy6G', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 10:30:34', '2026-04-14 10:25:34', 'Your ThanniGo OTP is 816458. Valid for 5 minutes.'),
(38, '+919025815982', '$2b$10$P2f8WgmvU1VuoDcqcz0zeOnOVgUej5pmOuOJO7YHambbRBKu53h3m', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 10:35:42', '2026-04-14 10:30:42', 'Your ThanniGo OTP is 328979. Valid for 5 minutes.'),
(39, '+919025815982', '$2b$10$2JuuKdWNKwetxMYP4g7nZutT1Qd/HNbLycN.o6Ndr3rv9rdW6Bjja', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 10:36:33', '2026-04-14 10:31:33', 'Your ThanniGo OTP is 798754. Valid for 5 minutes.'),
(40, '+919025815982', '$2b$10$kJ82pPacXk.XrSBc7B3dZe08kqzZHGi/8RYsT1v6PpHsAbymW4Tfu', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 10:42:34', '2026-04-14 10:37:34', 'Your ThanniGo OTP is 912720. Valid for 5 minutes.'),
(41, '+919025815982', '$2b$10$P8nhL/./.zlmFXob1eJHI.r4aqkklORFya/OKut2aEbF4uvwg6q3S', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:44:42', '2026-04-14 10:39:43', 'Your ThanniGo OTP is 887766. Valid for 5 minutes.'),
(42, '+919025815982', '$2b$10$EIX0Gm7lEnxJ/CyWuGDCseJYTjq.xATY.gGoJwzJd.xpv17Kmeng2', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:47:31', '2026-04-14 10:42:31', 'Your ThanniGo OTP is 354710. Valid for 5 minutes.'),
(43, '+919025815982', '$2b$10$UwMdCo7DivSKXGBfzzprcOyD78qEhzZ6WKNn2vHXkRlnZLPLBMStW', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:48:05', '2026-04-14 10:43:05', 'Your ThanniGo OTP is 373823. Valid for 5 minutes.'),
(44, '+919025815982', '$2b$10$P/Tm1nxY8CCd/I3c4XZz2OJUfCqiSadloPaa5H8pMJBB/Ij5FEvZe', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:49:30', '2026-04-14 10:44:30', 'Your ThanniGo OTP is 388701. Valid for 5 minutes.'),
(45, '+919025815982', '$2b$10$xj7RD27gi.NqMuoeWIeuJefsgZCHPp8uiiK7Bj.nsEzwIEKR31fR6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:53:19', '2026-04-14 10:48:19', 'Your ThanniGo OTP is 151964. Valid for 5 minutes.'),
(46, '+919025815982', '$2b$10$gyiVrGPLMrHSN0ctX7rRPeoRc1Ewsc.CQ033EEdyWL7DNJQfUF0v.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:55:10', '2026-04-14 10:50:10', 'Your ThanniGo OTP is 794791. Valid for 5 minutes.'),
(47, '+918428882777', '$2b$10$nHToHN8mxwdc/dTHyQIMueDqoU/nvJHxsHOpMXxPmZIpjFGrq99p.', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:55:36', '2026-04-14 10:50:36', 'Your ThanniGo OTP is 412097. Valid for 5 minutes.'),
(48, '+918428882777', '$2b$10$joOsj3333iZ/iLTtzXRdOOcUI8uc4zuSz10c7RSJVCj4hupJFJdTC', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:57:39', '2026-04-14 10:52:39', 'Your ThanniGo OTP is 684406. Valid for 5 minutes.'),
(49, '+919025815982', '$2b$10$aWLhoe.nAytOgUYcHkw2M.o6YSTBSM94ZaeNfslf3HMnPylgPvHUe', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 10:58:40', '2026-04-14 10:53:40', 'Your ThanniGo OTP is 764913. Valid for 5 minutes.'),
(50, '+918428882777', '$2b$10$NZIZIo/CiWVVcWmek1M4YOpRnM6lQ6yO2vcgLdpIo.9NiBEJgF23W', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 10:59:48', '2026-04-14 10:54:48', 'Your ThanniGo OTP is 985121. Valid for 5 minutes.'),
(51, '+919025815982', '$2b$10$2b8TYtLprWEdcGgD6/uF3udYxb8nk53NpzDswivDndCwVqWGPK5ve', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 11:14:04', '2026-04-14 11:09:04', 'Your ThanniGo OTP is 988457. Valid for 5 minutes.'),
(52, '+918428882777', '$2b$10$qQIT.eOaNjD31zpN39OHi.06m5tr4ws6hxk1.XohBesCVAGYHyAzi', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 11:28:18', '2026-04-14 11:23:18', 'Your ThanniGo OTP is 393606. Valid for 5 minutes.'),
(53, '+918428882777', '$2b$10$loDboZxI8MW43VZvfrixM.6wq84kXRpZf3WKEPagXd/nekQ8kUloq', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 11:47:57', '2026-04-14 11:42:57', 'Your ThanniGo OTP is 609553. Valid for 5 minutes.'),
(54, '+918428882777', '$2b$10$m1wRlRHAs5BdCa6PmFqAZOD5YRcqYOAiCjP7t.O6GMx0g/Y7wAQGa', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 11:56:40', '2026-04-14 11:51:40', 'Your ThanniGo OTP is 684219. Valid for 5 minutes.'),
(55, '+919025815982', '$2b$10$ZaV60mE4vyfaZHh./BRI5u2PpWK/vttoC4UvbWN.LNNWhG3/o3HF.', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 11:58:13', '2026-04-14 11:53:13', 'Your ThanniGo OTP is 450869. Valid for 5 minutes.'),
(56, '+919025815982', '$2b$10$upR6NQ7o0UJ.UTSL/hy2tejOlioqp1Bbz9UNFMJaGzkUyEtJpbkQC', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 12:28:39', '2026-04-14 12:23:39', 'Your ThanniGo OTP is 601196. Valid for 5 minutes.'),
(57, '+918428882777', '$2b$10$gWAe4DlzmMAJQ2ISac5UOOu1VuaKUI7sYEGaQ0WYrTBHJ/9Y0JO3G', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 12:33:35', '2026-04-14 12:28:35', 'Your ThanniGo OTP is 537659. Valid for 5 minutes.'),
(58, '+919876543210', '$2b$10$kI85YEm8Kzau7nAOUJPpcOrhEcM40Oup9FoWnjphWbLxm4S2hH3oO', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 12:42:46', '2026-04-14 12:37:46', 'Your ThanniGo OTP is 140584. Valid for 5 minutes.'),
(59, '+919025815982', '$2b$10$0NBPrJ4nVqw9St796fjWsO3Y7ZqiY9UPskb6hMmduODPd7s9jOQyK', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 12:48:54', '2026-04-14 12:43:54', 'Your ThanniGo OTP is 681565. Valid for 5 minutes.'),
(60, '+918428882777', '$2b$10$kdJ7DeNOlnbBWcDkWwyUeO.YrEqttf8qfYVHObrA2zHVnp2ipgJUC', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 12:58:58', '2026-04-14 12:53:58', 'Your ThanniGo OTP is 632775. Valid for 5 minutes.'),
(61, '+919025815982', '$2b$10$4hZaG8tV1.CntmomJ0Yd4OtLWWTOXIwmu/hYw2du68UShOWL54v/q', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 12:59:12', '2026-04-14 12:54:12', 'Your ThanniGo OTP is 924042. Valid for 5 minutes.'),
(62, '+919876543210', '$2b$10$uCISHQzUSbWxBAf6TaoUpOhC7WhjXrATzHAiKijJo22lyK8jfFtou', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 12:59:34', '2026-04-14 12:54:34', 'Your ThanniGo OTP is 680310. Valid for 5 minutes.'),
(63, '+919025815982', '$2b$10$YO9Q.ZWSYh0t..7Ye9HLGOr/puYzEiSBs.3DPu2QVjogNoAmJgetC', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:05:05', '2026-04-14 13:00:05', 'Your ThanniGo OTP is 181059. Valid for 5 minutes.'),
(64, '+919025815982', '$2b$10$gkHAb6eljDCoTb8ImEhcjOlqnbRgpGE.ucyxTLwsThjfcq/ufE9NW', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:09:37', '2026-04-14 13:04:37', 'Your ThanniGo OTP is 357102. Valid for 5 minutes.'),
(65, '+916363636363', '$2b$10$tmcjX09TrtkgDV2ra6uRuuDvymVMAEqVnl/vMvBOAsCwdXudo8OQi', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:10:17', '2026-04-14 13:05:17', 'Your ThanniGo OTP is 871923. Valid for 5 minutes.'),
(66, '+916363636363', '$2b$10$yIbZP2I9DhxQXEybQByCseSDj0Gp46zjuWZ2UTfc7wW7aXhEO4nLu', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:19:44', '2026-04-14 13:14:44', 'Your ThanniGo OTP is 445763. Valid for 5 minutes.'),
(67, '+916363636363', '$2b$10$Rch/s6idg1p.QzUgb6Xu3uq1S9/sy7N6aJYyOmojbhsOSRtyEuXja', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 13:23:18', '2026-04-14 13:18:18', 'Your ThanniGo OTP is 388362. Valid for 5 minutes.'),
(68, '+916363636363', '$2b$10$qu6/KTIINpWbx4P9572Td.sNIAxq4OaZQDw5FSpLxKGfsk7O5VPVW', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 13:25:34', '2026-04-14 13:20:34', 'Your ThanniGo OTP is 304015. Valid for 5 minutes.'),
(69, '+916363636363', '$2b$10$vAQ9OJbTx.LdaS2Yl.IzBOzCmjvd5dd7Jx2nxPMHLFsgaa3DVgKoa', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 13:28:12', '2026-04-14 13:23:12', 'Your ThanniGo OTP is 787848. Valid for 5 minutes.'),
(70, '+919025815982', '$2b$10$qgsBogPEEcpJ9S3Anr46V.XvFILZGamYYtMXafxqvH1CZIsHB2l52', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:36:13', '2026-04-14 13:31:13', 'Your ThanniGo OTP is 249423. Valid for 5 minutes.'),
(71, '+919876543210', '$2b$10$ikbrroOOnks2cWpEBL7cF.rdbHGBMum2xLY0m0Xta6kfHpC98KtIq', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 13:37:39', '2026-04-14 13:32:39', 'Your ThanniGo OTP is 339724. Valid for 5 minutes.'),
(72, '+919876543210', '$2b$10$36kjvs3tho.flUgToybQZ.O1UQOgJkS/AHmgPigaKeKb00qOgKlRG', 'login', 'verified', '::ffff:192.168.31.117', 'UnknownDevice', '2026-04-14 13:44:35', '2026-04-14 13:39:35', 'Your ThanniGo OTP is 251370. Valid for 5 minutes.'),
(73, '+916363636363', '$2b$10$9/F.0RKYyZP33HqMZ7IG7OYajwgEdXkmEKlRy7K.f5XeSZBC4P9Ti', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:51:09', '2026-04-14 13:46:09', 'Your ThanniGo OTP is 355610. Valid for 5 minutes.'),
(74, '+916363636363', '$2b$10$44bCk1ar5dwxbJ/4uzC6ru1laWEh4qdLt0BuNZzuYjtRqLf7Hkr3G', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 13:52:03', '2026-04-14 13:47:03', 'Your ThanniGo OTP is 464951. Valid for 5 minutes.'),
(75, '+918888888888', '$2b$10$PuCSgcdrjQ0T4vBMJ/R.qu1MUdF5xyNo8ZyURjFkL7jRn80S4aXlC', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 14:24:00', '2026-04-14 14:19:00', 'Your ThanniGo OTP is 414420. Valid for 5 minutes.'),
(76, '+918888888888', '$2b$10$0qknAJbVXzEbWnY8wUrG3uHcSh4e7wI0iE/VkNH9IllNuLTMYwU/e', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 14:39:22', '2026-04-14 14:34:22', 'Your ThanniGo OTP is 768144. Valid for 5 minutes.'),
(77, '+917777777777', '$2b$10$Gj4xAyl5wGdxW5cMcrPKLeV/FMQQbinwfhcvUyHI18fLhPPAt8CXW', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 14:39:48', '2026-04-14 14:34:48', 'Your ThanniGo OTP is 988637. Valid for 5 minutes.'),
(78, '+918888888888', '$2b$10$HImYgpAZt8hul7m9oETP8ugyWapZ8UriMlrz.v16I91qn0wCop/.e', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 18:22:22', '2026-04-14 18:17:22', 'Your ThanniGo OTP is 338659. Valid for 5 minutes.'),
(79, '+918428882777', '$2b$10$RsHqbTQF9cVheb.3XKKKi.oJWxARtGS.vsmT2sZ4Fk1PE.90uEC8O', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 18:23:28', '2026-04-14 18:18:28', 'Your ThanniGo OTP is 417315. Valid for 5 minutes.'),
(80, '+917777777777', '$2b$10$eZzPC0roBiSKO15y1m.aVOguzJoQVQU983DROJZ4bZXIYZ.k7OuMC', 'login', 'sent', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 18:23:46', '2026-04-14 18:18:46', 'Your ThanniGo OTP is 116373. Valid for 5 minutes.'),
(81, '+916363636363', '$2b$10$Hxp9TTXqRkNKZ9G5qkN0A.cC5WuLRDVSkfwXkAio6xBWEyrchr1/W', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 18:23:58', '2026-04-14 18:18:58', 'Your ThanniGo OTP is 381205. Valid for 5 minutes.'),
(82, '+916363636363', '$2b$10$e8OQVpxexb/ghOiG8Vej0.qCYqd0MbEL0eO2qqcCQGmSWTSa0KnwK', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 18:50:31', '2026-04-14 18:45:31', 'Your ThanniGo OTP is 749417. Valid for 5 minutes.'),
(83, '+916363636363', '$2b$10$9Wz5LVtsIlumtDKkg4qO5urO7KMgg1xzydwQjsyvAfyeSo7SK8zCu', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 21:03:38', '2026-04-14 20:58:38', 'Your ThanniGo OTP is 222258. Valid for 5 minutes.'),
(84, '+916363636363', '$2b$10$bzyyxIwcf/Uo28xGgjZFnerP90c8tBw5NfCzQEKmIwwZGUsDJjFC6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 21:23:09', '2026-04-14 21:18:09', 'Your ThanniGo OTP is 265863. Valid for 5 minutes.'),
(85, '+916363636363', '$2b$10$Gn5Kn7es/Qb0i6Gv1yp69eJU0vJAg/HLFOHPz1uPdyj5DE/Fwfu9S', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 21:23:50', '2026-04-14 21:18:50', 'Your ThanniGo OTP is 605030. Valid for 5 minutes.'),
(86, '+916363636363', '$2b$10$0carvPUoZqHllCGZ.eTDfONQ.LGAbdzEyHFhvbjqJ.SN3jSY/CHHK', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 21:31:53', '2026-04-14 21:26:53', 'Your ThanniGo OTP is 378919. Valid for 5 minutes.'),
(87, '+916363636363', '$2b$10$WfCVZszVzEd0ifqGUrXmi.7LtIhuXZpTn8RoIgpNcnSj.YCwjzeCW', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 21:50:03', '2026-04-14 21:45:03', 'Your ThanniGo OTP is 485181. Valid for 5 minutes.'),
(88, '+919876543210', '$2b$10$hKli4dK4a0O2UgbiKEUu9epi6jYz3WUph7wdLmP/jWxkiLe/OLvuC', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 22:02:21', '2026-04-14 21:57:21', 'Your ThanniGo OTP is 224436. Valid for 5 minutes.'),
(89, '+919025815982', '$2b$10$a28a77JdcEzpKEIwKI5KuO8VB/kUWS3I5UDWWBoAtqBpyAgfzhVLS', 'login', 'verified', '::ffff:192.168.31.56', 'AP3A.240905.015.A2', '2026-04-14 22:11:31', '2026-04-14 22:06:31', 'Your ThanniGo OTP is 788739. Valid for 5 minutes.'),
(90, '+916363636363', '$2b$10$IVv4pZiryg6YBqjPrLBOkO1Ivd27ZWhkeAiSC7pJFcgBq6vHFfItO', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 23:09:09', '2026-04-14 23:04:09', 'Your ThanniGo OTP is 903786. Valid for 5 minutes.'),
(91, '+916363636363', '$2b$10$DDCAAQHSZZBxWWp4NRTlM.fGN4DNDHY2h3xTADTxFtMk7WOGbBKVy', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-14 23:17:22', '2026-04-14 23:12:22', 'Your ThanniGo OTP is 487082. Valid for 5 minutes.'),
(92, '+918111111111', '$2b$10$nMxIaMgDk4IkryMa.tzTi.WL0b5vM40YberE8VwPCndCTrZm7OkfK', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:09:57', '2026-04-15 00:04:57', 'Your ThanniGo OTP is 979189. Valid for 5 minutes.'),
(93, '+918111111111', '$2b$10$nuZ3xwp3H55cBD9ro2g0xu9fC8v1tvE4xSEd/9tPEOAFdXlSTaFZy', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:13:24', '2026-04-15 00:08:24', 'Your ThanniGo OTP is 720556. Valid for 5 minutes.'),
(94, '+918111111111', '$2b$10$G9/3OS.jNJscIvmoAJUmS.eUmmqOMzZCemmyWO7COYI3vndQXoyJi', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:13:58', '2026-04-15 00:08:58', 'Your ThanniGo OTP is 416542. Valid for 5 minutes.'),
(95, '+918111111111', '$2b$10$GRqyVN3si7.IcQShqQQNHOaiBxOyVATaVzj/.wND5Q5dc/SFwdZO6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:14:37', '2026-04-15 00:09:37', 'Your ThanniGo OTP is 191266. Valid for 5 minutes.'),
(96, '+918111111111', '$2b$10$rKkEc6mjSa7M5lWZI3i1Eu.lzmX7NcnQcpFKj2faSLOlr9OFWL3Sq', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:15:13', '2026-04-15 00:10:13', 'Your ThanniGo OTP is 646566. Valid for 5 minutes.'),
(97, '+918111111111', '$2b$10$pNx1n6ikI2cfAH0fa.jFs.skcwP0wbZsRgT0c5SaR1V43sbCC7rVe', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:16:44', '2026-04-15 00:11:44', 'Your ThanniGo OTP is 194686. Valid for 5 minutes.'),
(98, '+918111111111', '$2b$10$d0WP4lpOCJa8zxV0KaKrd.o/7Ic6PExDNcRNIoB0pU7pZ2/wtmvlW', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:18:23', '2026-04-15 00:13:23', 'Your ThanniGo OTP is 353781. Valid for 5 minutes.'),
(99, '+916363636363', '$2b$10$ZbTgOtt8PzFeTxenepcYi.uECnBUx.bGfrg9jjXOU5uJbVB3ia4GS', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:18:57', '2026-04-15 00:13:57', 'Your ThanniGo OTP is 580258. Valid for 5 minutes.'),
(100, '+919025815982', '$2b$10$FNX0lv28l4U9/5JpwTmWFeAOl8tgV5q1Cur1tSZYjD.wXoANoC8Kq', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:22:25', '2026-04-15 00:17:26', 'Your ThanniGo OTP is 756748. Valid for 5 minutes.'),
(101, '+916363636363', '$2b$10$cBP9qPNixSbMymya2QKSLedpvOtdP6VLnAAlreo6bCM/Opa/SApy6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:24:51', '2026-04-15 00:19:51', 'Your ThanniGo OTP is 879904. Valid for 5 minutes.'),
(102, '+916111111111', '$2b$10$Ob/Ie3.IG35dP10PnWKxK.Dd9kEEf.KwqRXPCaGQnS.tXK.7wSrF2', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:36:41', '2026-04-15 00:31:41', 'Your ThanniGo OTP is 524155. Valid for 5 minutes.'),
(103, '+916111111111', '$2b$10$BlaGZ/B0sjDIlt2W1eYFOO0FwA89Pq1gzm.x6M4iTgSgGtWsc.1uu', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:37:20', '2026-04-15 00:32:20', 'Your ThanniGo OTP is 770070. Valid for 5 minutes.'),
(104, '+916363636363', '$2b$10$YuOHLKCcBgf4MyYIUofdEeRvcp8qKTuOoNru6Dtu5bAtJI4TvRDm6', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:38:22', '2026-04-15 00:33:22', 'Your ThanniGo OTP is 552974. Valid for 5 minutes.'),
(105, '+919025815982', '$2b$10$0xBjxi1F6r/6xfyQAqhY0ex2SE8XsEySFeAizMAQcBetfmW1sM5Xa', 'login', 'verified', '::ffff:192.168.31.39', 'AQ3A.240929.001', '2026-04-15 00:46:57', '2026-04-15 00:41:57', 'Your ThanniGo OTP is 974953. Valid for 5 minutes.'),
(106, '+916363636363', '$2b$10$zpoFCRgVOGokWQ3BvZMb2eOeQ5y2MQnfJsRmTb95e6kV8VcROCwZO', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:01:52', '2026-04-15 11:56:52', 'Your ThanniGo OTP is 882010. Valid for 5 minutes.'),
(107, '+918111111111', '$2b$10$IJz1kBm923RPkj6iJfpeKeJKxDGqSRlPmvuYH3YilNDXVK6EPwOFq', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:03:47', '2026-04-15 11:58:47', 'Your ThanniGo OTP is 250376. Valid for 5 minutes.'),
(108, '+919025815982', '$2b$10$o1Pk6Df73aHbgbDxAS3Dtu6trk9mYw7u20BuVy.H8q.X4eKZuTkwi', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:05:48', '2026-04-15 12:00:48', 'Your ThanniGo OTP is 670285. Valid for 5 minutes.'),
(109, '+918111111111', '$2b$10$FZ6B8HZsiOoUySeSVJ1v9O.bU11kJNVa44fY/PRfoql2ljYV090LS', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:08:48', '2026-04-15 12:03:48', 'Your ThanniGo OTP is 510786. Valid for 5 minutes.'),
(110, '+918222222222', '$2b$10$5/5tzEuyCfitguNMN.rZhOkaNd5q.FpgE20HXZfJTakVQAEK8aqUq', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:10:26', '2026-04-15 12:05:26', 'Your ThanniGo OTP is 195480. Valid for 5 minutes.'),
(111, '+918222222222', '$2b$10$aefP2tuyns3I6EKLe5miFO2GKDc8xR4FFIRHHBXANMICBZ3lF68Fq', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:12:52', '2026-04-15 12:07:52', 'Your ThanniGo OTP is 189148. Valid for 5 minutes.'),
(112, '+916363636363', '$2b$10$50J0Nb/ulrDBN4lDTva9wuHoUBHBGc41RB9o.Al6e7rQ5Rom1PEAe', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 12:51:20', '2026-04-15 12:46:20', 'Your ThanniGo OTP is 177038. Valid for 5 minutes.'),
(113, '+918222222222', '$2b$10$SP8Z3K8gt/daqrBnt5Ot8uzmMzMzhJHYFqJ4FjKqEk.KbszUGTHKS', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 14:41:01', '2026-04-15 14:36:01', 'Your ThanniGo OTP is 315829. Valid for 5 minutes.'),
(114, '+918222222222', '$2b$10$pMlbGT9EPyY4.EE1T1rPh.R0Zi8tkU2bSOqZZc2SxXTklk8QhY0TS', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 14:44:57', '2026-04-15 14:39:57', 'Your ThanniGo OTP is 689555. Valid for 5 minutes.'),
(115, '+916363636363', '$2b$10$vIcXEfioJe4vfxFsJUtdbOjnDj.XsyMM5j.SGxJWekgb8Tp/hB0SC', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 14:45:14', '2026-04-15 14:40:14', 'Your ThanniGo OTP is 972049. Valid for 5 minutes.'),
(116, '+919876543210', '$2b$10$tm953XUzOg5g503T7PTzFe8brfo/I/QV/0Oc16XmIORSh8YqLT8vO', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 14:54:35', '2026-04-15 14:49:35', 'Your ThanniGo OTP is 895516. Valid for 5 minutes.'),
(117, '+919876543210', '$2b$10$uhWkZ59oMDWsSw5biiEdCeEK02bFzyvhrnsOVwNytz04tfNY9Om22', 'login', 'sent', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 15:29:20', '2026-04-15 15:24:20', 'Your ThanniGo OTP is 689238. Valid for 5 minutes.'),
(118, '+919876543210', '$2b$10$YH1c0nUD6w6nf4oYErFsteaU9UXsxl/xrE4hX.d6NsvUXFQbN103K', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 15:42:21', '2026-04-15 15:37:21', 'Your ThanniGo OTP is 128196. Valid for 5 minutes.'),
(119, '+916363636363', '$2b$10$4fHPDCe47v3v7CFXV98Vyed/A4q.po2NqK3DzZkySaKWWHnNSjjpO', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 15:55:43', '2026-04-15 15:50:43', 'Your ThanniGo OTP is 901001. Valid for 5 minutes.'),
(120, '+919025815982', '$2b$10$DmgfpjFl8C9f.NJW2g97juRsr4qIj0pOtYzZklE6NmM7X9YRyy4g.', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 15:57:33', '2026-04-15 15:52:33', 'Your ThanniGo OTP is 867410. Valid for 5 minutes.'),
(121, '+916363636363', '$2b$10$NQYsmkjuMCtcSA3AQlMfguhykOEQXIs9U89tsH/xNCf2sBubIXdPm', 'login', 'verified', '::ffff:192.168.0.80', 'AQ3A.240929.001', '2026-04-15 16:00:11', '2026-04-15 15:55:11', 'Your ThanniGo OTP is 874747. Valid for 5 minutes.');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `method` varchar(20) NOT NULL COMMENT 'cod | upi | credit',
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | paid | failed | refunded | disputed',
  `upi_txn_id` varchar(100) DEFAULT NULL,
  `upi_vpa` varchar(50) DEFAULT NULL,
  `gateway_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gateway_response`)),
  `paid_at` datetime DEFAULT NULL,
  `recorded_by` bigint(20) UNSIGNED DEFAULT NULL,
  `razorpay_order_id` varchar(50) DEFAULT NULL COMMENT 'Razorpay order_XXXXX',
  `razorpay_payment_id` varchar(50) DEFAULT NULL COMMENT 'Razorpay pay_XXXXX',
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'INR',
  `attempt_number` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `is_webhook_verified` tinyint(1) NOT NULL DEFAULT 0,
  `webhook_received_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_attempts`
--

CREATE TABLE `payment_attempts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'NULL until payment record created',
  `attempt_number` tinyint(3) UNSIGNED NOT NULL,
  `razorpay_order_id` varchar(50) DEFAULT NULL,
  `razorpay_payment_id` varchar(50) DEFAULT NULL,
  `method` varchar(20) NOT NULL COMMENT 'upi | card | netbanking',
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL COMMENT 'initiated | failed | success',
  `failure_code` varchar(50) DEFAULT NULL,
  `failure_reason` varchar(255) DEFAULT NULL,
  `gateway_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gateway_response`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payout_logs`
--

CREATE TABLE `payout_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `wallet_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(20) NOT NULL COMMENT 'credit | debit | refund_debit | commission',
  `amount` decimal(12,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_amount` decimal(12,2) NOT NULL COMMENT 'amount - commission_amount',
  `balance_after` decimal(12,2) NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `payout_mode` varchar(20) DEFAULT NULL COMMENT 'instant | scheduled | manual',
  `payout_status` varchar(20) DEFAULT 'pending' COMMENT 'pending | processing | completed | failed',
  `razorpay_payout_id` varchar(100) DEFAULT NULL,
  `razorpay_transfer_id` varchar(100) DEFAULT NULL,
  `utr_number` varchar(50) DEFAULT NULL COMMENT 'Bank UTR / reference number for completed transfers',
  `description` varchar(255) DEFAULT NULL,
  `failed_reason` text DEFAULT NULL,
  `initiated_by` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'User ID (admin or shop owner) who triggered payout',
  `scheduled_for` date DEFAULT NULL COMMENT 'Settlement date for scheduled payouts',
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plan_features`
--

CREATE TABLE `plan_features` (
  `id` int(10) UNSIGNED NOT NULL,
  `plan_id` int(10) UNSIGNED NOT NULL,
  `feature_id` int(10) UNSIGNED NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `usage_limit` int(11) DEFAULT NULL COMMENT 'Monthly usage cap for this feature in this plan (null = unlimited)',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `platform_plans`
--

CREATE TABLE `platform_plans` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(50) NOT NULL COMMENT 'Free | Customer Pro | Shop Pro | Shop Premium',
  `slug` varchar(50) NOT NULL COMMENT 'free | customer_pro | shop_pro | shop_premium',
  `role` varchar(20) NOT NULL COMMENT 'customer | shop_owner | both',
  `price_monthly` decimal(8,2) NOT NULL DEFAULT 0.00,
  `price_yearly` decimal(8,2) DEFAULT 0.00,
  `free_delivery_count` int(11) NOT NULL DEFAULT 0 COMMENT 'Number of free deliveries per month (0 = unlimited if plan active)',
  `auto_discount_pct` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Auto discount % applied on every order',
  `monthly_coupon_count` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of coupons issued automatically each month',
  `monthly_coupon_value` decimal(8,2) NOT NULL DEFAULT 0.00 COMMENT 'Face value of each auto-issued coupon',
  `loyalty_boost_pct` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT '+% extra loyalty points on every order',
  `razorpay_plan_id` varchar(100) DEFAULT NULL COMMENT 'Razorpay subscription plan ID for auto-renewal',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'water',
  `price` decimal(8,2) NOT NULL,
  `deposit_amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(8,2) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `empty_cans` int(11) NOT NULL DEFAULT 0,
  `low_stock_alert` int(11) NOT NULL DEFAULT 10,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `image_url` varchar(2048) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `subcategory_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `shop_id`, `name`, `sku`, `type`, `price`, `deposit_amount`, `cost_price`, `stock_quantity`, `empty_cans`, `low_stock_alert`, `is_available`, `image_url`, `created_at`, `updated_at`, `subcategory_id`) VALUES
(1, 2, '20L Bubbletop Can', NULL, 'WATER_CAN', 40.00, 0.00, NULL, 50, 0, 10, 1, '/uploads/shop_doc/SHOP_2_product_catalog_1776142164529_2610d3feaa0ddb60.jpg', '2026-04-13 23:25:33', '2026-04-14 10:21:59', 1),
(2, 2, '10L Dispenser Can', NULL, 'WATER_CAN', 40.00, 0.00, NULL, 50, 0, 10, 1, NULL, '2026-04-13 23:25:33', '2026-04-14 10:21:59', 2),
(3, 2, '25L Commercial Can', NULL, 'WATER_CAN', 40.00, 0.00, NULL, 50, 0, 10, 1, NULL, '2026-04-13 23:25:33', '2026-04-14 10:21:59', 3),
(4, 3, '20L Bubbletop Can', NULL, 'water', 40.00, 0.00, NULL, 50, 0, 10, 1, NULL, '2026-04-14 01:22:58', '2026-04-14 01:22:58', 1),
(5, 4, '10L Dispenser Can', NULL, 'water', 40.00, 0.00, NULL, 50, 0, 10, 1, NULL, '2026-04-14 01:28:33', '2026-04-14 01:28:33', 2),
(6, 4, '25L Commercial Can', NULL, 'water', 50.00, 0.00, NULL, 100, 0, 10, 1, NULL, '2026-04-14 01:28:33', '2026-04-14 01:28:33', 3),
(7, 4, '20L Bubbletop Can', NULL, 'water', 50.00, 0.00, NULL, 100, 0, 10, 1, '/uploads/shop_doc/SHOP_4_product_catalog_1776139672357_a5924496f39f8b70.jpg', '2026-04-14 09:38:05', '2026-04-14 09:38:05', 1),
(8, 5, '20L Bubbletop Can', NULL, 'WATER_CAN', 40.00, 0.00, NULL, 50, 0, 10, 1, NULL, '2026-04-14 13:30:27', '2026-04-14 13:30:27', 1),
(9, 7, '20L Bubbletop Can', NULL, 'WATER_CAN', 40.00, 150.00, NULL, 50, 0, 10, 1, NULL, '2026-04-15 14:39:46', '2026-04-15 14:39:46', 1),
(10, 7, '10L Dispenser Can', NULL, 'WATER_CAN', 40.00, 150.00, NULL, 50, 0, 10, 1, NULL, '2026-04-15 14:39:46', '2026-04-15 14:39:46', 2),
(11, 7, '2L Individual Bottle', NULL, 'NORMAL', 40.00, 150.00, NULL, 50, 0, 10, 1, NULL, '2026-04-15 14:39:46', '2026-04-15 14:39:46', 7);

-- --------------------------------------------------------

--
-- Table structure for table `ratings_reviews`
--

CREATE TABLE `ratings_reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `reviewer_user_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `delivery_person_id` bigint(20) UNSIGNED DEFAULT NULL,
  `shop_rating` tinyint(3) UNSIGNED NOT NULL,
  `delivery_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `water_quality_rating` tinyint(3) UNSIGNED DEFAULT NULL,
  `review_text` text DEFAULT NULL,
  `photo_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photo_urls`)),
  `is_visible` tinyint(1) NOT NULL DEFAULT 1,
  `shop_response` text DEFAULT NULL,
  `shop_responded_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referrals`
--

CREATE TABLE `referrals` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `referrer_id` bigint(20) UNSIGNED NOT NULL,
  `referee_id` bigint(20) UNSIGNED DEFAULT NULL,
  `referral_code` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | completed | expired',
  `created_at` datetime NOT NULL,
  `referred_shop_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'customer' COMMENT 'customer | shop',
  `reward_stage` varchar(30) NOT NULL DEFAULT 'signup' COMMENT 'signup | first_order | approval | order_5'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `referrals`
--

INSERT INTO `referrals` (`id`, `referrer_id`, `referee_id`, `referral_code`, `status`, `created_at`, `referred_shop_id`, `type`, `reward_stage`) VALUES
(1, 4, 6, 'TG-1B1D32', 'pending', '2026-04-14 13:10:49', NULL, 'customer', 'signup');

-- --------------------------------------------------------

--
-- Table structure for table `referral_rewards`
--

CREATE TABLE `referral_rewards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `referral_id` bigint(20) UNSIGNED NOT NULL,
  `user_id_rewarded` bigint(20) UNSIGNED NOT NULL,
  `points` int(11) NOT NULL,
  `reward_type` varchar(30) NOT NULL COMMENT 'SIGNUP | FIRST_ORDER | SHOP_APPROVAL | SHOP_ORDERS',
  `status` varchar(20) NOT NULL DEFAULT 'credited' COMMENT 'pending | credited | failed',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `referral_rewards`
--

INSERT INTO `referral_rewards` (`id`, `referral_id`, `user_id_rewarded`, `points`, `reward_type`, `status`, `created_at`) VALUES
(1, 1, 4, 20, 'SIGNUP', 'credited', '2026-04-14 13:10:49');

-- --------------------------------------------------------

--
-- Table structure for table `referral_settings`
--

CREATE TABLE `referral_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `signup_bonus_points` int(11) NOT NULL DEFAULT 20 COMMENT 'Points awarded to referrer on friend signup',
  `first_order_bonus_referrer` int(11) NOT NULL DEFAULT 30 COMMENT 'Points awarded to referrer on friend''s 1st successful order',
  `first_order_bonus_referee` int(11) NOT NULL DEFAULT 20 COMMENT 'Points awarded to the friend on their 1st successful order',
  `shop_approval_bonus` int(11) NOT NULL DEFAULT 50 COMMENT 'Points awarded to referrer when referred shop is approved',
  `shop_milestone_bonus` int(11) NOT NULL DEFAULT 100 COMMENT 'Points awarded to referrer after 5 orders by referred shop',
  `max_referrals_per_user` int(11) NOT NULL DEFAULT 50 COMMENT 'Lifetime limit on total successful referrals per user',
  `max_referrals_per_day` int(11) NOT NULL DEFAULT 5 COMMENT 'Prevents spam by limiting daily referral signups',
  `max_referral_pts_limit` int(11) NOT NULL DEFAULT 2000 COMMENT 'Absolute cap on points a user can earn from referrals',
  `min_order_amount_for_reward` decimal(10,2) NOT NULL DEFAULT 100.00 COMMENT 'Min order subtotal required to unlock order rewards',
  `reward_on_signup` tinyint(1) NOT NULL DEFAULT 1,
  `reward_on_first_order` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | inactive',
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `referral_settings`
--

INSERT INTO `referral_settings` (`id`, `signup_bonus_points`, `first_order_bonus_referrer`, `first_order_bonus_referee`, `shop_approval_bonus`, `shop_milestone_bonus`, `max_referrals_per_user`, `max_referrals_per_day`, `max_referral_pts_limit`, `min_order_amount_for_reward`, `reward_on_signup`, `reward_on_first_order`, `status`, `updated_at`) VALUES
(1, 20, 30, 20, 50, 100, 50, 5, 2000, 100.00, 1, 1, 'active', '2026-04-14 11:46:30');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token_hash` varchar(255) NOT NULL COMMENT 'SHA-256 hash of the opaque refresh token',
  `expires_at` datetime NOT NULL COMMENT '30 days from creation',
  `revoked` tinyint(1) NOT NULL DEFAULT 0,
  `device_id` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked`, `device_id`, `created_at`) VALUES
(1, 1, '6bab79b0db8e147693e5de11e59267bbd478b1dda5feaff8ed8186ad814d1405', '2026-05-13 22:53:01', 1, 'AQ3A.240929.001', '2026-04-13 22:53:01'),
(2, 1, 'aa6c1854eff129728352395e8b9321f03d98d38d5bfee695d868ebcb3ae34db8', '2026-05-13 22:53:09', 0, NULL, '2026-04-13 22:53:09'),
(3, 1, 'abce909ed9ad084f15df472501e3c82309322432c83d804c624b58985c1d5336', '2026-05-13 22:55:29', 0, NULL, '2026-04-13 22:55:29'),
(4, 1, 'a7b77d07483d3654718ae29759b13b9bd006b92eb81d9f684a0106990425783f', '2026-05-13 22:55:37', 0, NULL, '2026-04-13 22:55:37'),
(5, 1, 'd258e28da1ea619cea247f49f0bcc8cee64ab1f1c6256c03423ce57ddb936ed7', '2026-05-13 23:01:25', 0, NULL, '2026-04-13 23:01:25'),
(6, 1, '3408f5d1ea28d3119eb822b01547fab6a2410136fd540ce819203a2d7577b85a', '2026-05-13 23:03:19', 0, NULL, '2026-04-13 23:03:19'),
(7, 1, 'c15ee15c4154cb5101292c3d144817a8b96c03e47686c4c13732bf1b43fe3881', '2026-05-13 23:03:26', 0, NULL, '2026-04-13 23:03:26'),
(8, 1, '0c350d3294825aec8cb4a84e48612e56889dc1af8cdda7522cf326c1ece821ea', '2026-05-13 23:03:47', 0, NULL, '2026-04-13 23:03:47'),
(9, 1, '5da50240499c969b1c8f062454d9036df7eaaca9c9c139720a75372313f4d540', '2026-05-13 23:05:47', 0, NULL, '2026-04-13 23:05:47'),
(10, 2, 'b31c67943561021b13c3b1790cfa3d94d75db9ed3757e4e44205fd8ed56f173c', '2026-05-13 23:10:12', 1, 'AQ3A.240929.001', '2026-04-13 23:10:12'),
(11, 2, '2093bf1e0a5b6f152214ca3d03788d0af89a1a3f1c9c1424ad927d7f7dad8e0b', '2026-05-13 23:11:07', 1, 'AQ3A.240929.001', '2026-04-13 23:11:07'),
(12, 1, '265565bfe9e191d643b7437714389b50f946084da22ac47c4c4e65aba0b8d79b', '2026-05-13 23:18:37', 1, 'AQ3A.240929.001', '2026-04-13 23:18:37'),
(13, 1, '3c09477cc37c83362565976d768ad1d97e4936645ae0a3c021d5975c87924d2b', '2026-05-13 23:26:26', 1, 'AQ3A.240929.001', '2026-04-13 23:26:26'),
(14, 1, '98d757776b19b064fd943e8ca5ff2f3e4feb288bd0367d6940733c7fee35b539', '2026-05-13 23:27:57', 1, 'AQ3A.240929.001', '2026-04-13 23:27:57'),
(15, 2, 'bc6f626c29fbd95456e985629086e9a91977392cf6db58bcd2c0ec57664d7983', '2026-05-13 23:28:48', 1, 'AQ3A.240929.001', '2026-04-13 23:28:48'),
(16, 2, 'df537b636642c25d1c611bfd8a6b775c5ed31c653f23fb783ed824da92cc6fb0', '2026-05-13 23:48:32', 1, 'AQ3A.240929.001', '2026-04-13 23:48:32'),
(17, 1, 'd5b50c67da122dd7cd5d52f1911f5215a1177c8f2c3d85752fabf09b5b90c0e6', '2026-05-14 00:04:02', 1, 'AQ3A.240929.001', '2026-04-14 00:04:02'),
(18, 2, '535d6b8162fe847f8bb499ac2dea64e9c6bd794dfea81e843a10ba97c5253b7f', '2026-05-14 00:05:32', 1, 'AQ3A.240929.001', '2026-04-14 00:05:32'),
(19, 1, 'e8f8e32e22d6713ee19e1c1e6fe79aa30eaffadb083159560743f4310a4fc89a', '2026-05-14 00:10:41', 1, 'AQ3A.240929.001', '2026-04-14 00:10:41'),
(20, 3, 'b03595833476f1b03c477cf5ff2154c9d4770f889474072f2b4ab7a5b4a227f8', '2026-05-14 00:11:20', 1, 'AQ3A.240929.001', '2026-04-14 00:11:20'),
(21, 3, '8d414e98c02d8bcc41ce089e22f88494d656c18a127291efd7603b1b14a32542', '2026-05-14 00:11:48', 0, NULL, '2026-04-14 00:11:48'),
(22, 4, 'a82bf75bd5fe920c3b7b3a702813173457fd19c449764d534438bbbd71cdb752', '2026-05-14 00:17:12', 1, 'AQ3A.240929.001', '2026-04-14 00:17:12'),
(23, 4, '8177166ff7cf3ee6d75daec1511fa18e2e1568700f3ce41df5013a9bc559f2cc', '2026-05-14 00:17:16', 0, NULL, '2026-04-14 00:17:16'),
(24, 3, '4bd21f937ed36749ef556d20b76c5005bb8774db69d3d45ecc0cc27ec32038c4', '2026-05-14 00:20:28', 1, 'AQ3A.240929.001', '2026-04-14 00:20:28'),
(25, 3, '06eee56d19b0460128ed3d2e6954e8907844bb31e24dae60101ff8c984de6b2d', '2026-05-14 00:22:20', 1, 'AQ3A.240929.001', '2026-04-14 00:22:20'),
(26, 3, '3017dd2f16c295a6458c6303c3081347165914ea65e779aa35ab885c07889939', '2026-05-14 00:24:40', 1, 'AQ3A.240929.001', '2026-04-14 00:24:40'),
(27, 1, 'db3b92ba22f3b226b63002f9c91f5fe1d8488b86dad2cbd3aa4e22e7ffb74729', '2026-05-14 00:47:54', 1, 'AQ3A.240929.001', '2026-04-14 00:47:54'),
(28, 3, 'cbbb3d3660efbad0c064d7dc03c264d0caae8021c8f35c3132f1044464e942e4', '2026-05-14 00:48:43', 1, 'AQ3A.240929.001', '2026-04-14 00:48:43'),
(29, 4, 'ebfb83a34263fef00b2002e3f98f1e2c9a9b23eb7e836b7dbd3fb6973b02af1b', '2026-05-14 00:51:16', 1, 'AQ3A.240929.001', '2026-04-14 00:51:16'),
(30, 4, 'f560acd655cb57f8a977dc1647cb2492c14087beb809bf224730db5421f989e2', '2026-05-14 00:51:20', 0, NULL, '2026-04-14 00:51:20'),
(31, 4, 'ecb245de14fd24d32ceb319bed26617f7092cf0aee788d348cee40a441c7d97a', '2026-05-14 01:10:36', 1, 'AQ3A.240929.001', '2026-04-14 01:10:36'),
(32, 2, 'c9f760288dee58d9e38f0e39189838fa4c85f1bf12b619cff510a64e312e01bd', '2026-05-14 01:19:31', 1, 'AQ3A.240929.001', '2026-04-14 01:19:31'),
(33, 4, '30745b10c9b84e4feee6b4d8fb06ca1343211c21b147fdd9b9950aae138e86ac', '2026-05-14 01:21:03', 0, 'AQ3A.240929.001', '2026-04-14 01:21:03'),
(34, 2, '6cea6d47fb49acb0b3d46aa9c0206ef01c3c3b8707ed242a2202157e3576d2ea', '2026-05-14 01:23:53', 1, 'AQ3A.240929.001', '2026-04-14 01:23:53'),
(35, 5, '55a7099d4ac3d2298729a88aa35bd1d36b370bba1e8bc1a12e6340079a758bdb', '2026-05-14 01:26:10', 1, 'AQ3A.240929.001', '2026-04-14 01:26:10'),
(36, 5, 'ce637dc02359c9a16f48ba885a1954d566fc933ca6b74f0d4f9c4581c5437954', '2026-05-14 01:26:14', 0, NULL, '2026-04-14 01:26:14'),
(37, 2, '7cfe2428720f7662806d9d8d5c1fa92f3c14001308b25b76646ddc8d46c1ba9c', '2026-05-14 01:29:05', 1, 'AQ3A.240929.001', '2026-04-14 01:29:05'),
(38, 3, '90d6db4ae531529b309f7f6ff5f01f33bcee0d0c2d484d33a25fb39a4f7e8e83', '2026-05-14 09:07:21', 1, 'AQ3A.240929.001', '2026-04-14 09:07:21'),
(39, 1, 'fb2681dd6ab943ff7e69f5cc4584a1400071280380695568043a3c959e34fa02', '2026-05-14 09:19:34', 1, 'AQ3A.240929.001', '2026-04-14 09:19:34'),
(40, 2, '2ab837de625f50f63eee90240559254310d8b59c380a0e214ce11703fbb26140', '2026-05-14 09:27:46', 1, 'AP3A.240905.015.A2', '2026-04-14 09:27:46'),
(41, 1, 'bff72c38b0c3853f8673742c1cb701e4d8e251735118959751cb2cc31317441e', '2026-05-14 09:35:12', 1, 'AQ3A.240929.001', '2026-04-14 09:35:12'),
(42, 5, '10d4b7bf3e8b744f344220c0ff32c08c88a0f02809e75284e8c61c26f5ca153f', '2026-05-14 09:36:50', 0, 'AQ3A.240929.001', '2026-04-14 09:36:50'),
(43, 1, 'e37d50cce77943dbcdfa564fb4167a25c4e2b1cf440dd90d842e8cf3b46d841e', '2026-05-14 09:55:02', 1, 'AQ3A.240929.001', '2026-04-14 09:55:02'),
(44, 1, '9467502f00a487a3a9c0d4593584c9b4af792b796e59037b618a1377137e7ea7', '2026-05-14 10:12:12', 1, 'AQ3A.240929.001', '2026-04-14 10:12:12'),
(45, 2, '4bd783658475afcaeee7efb806cfcf91ffafe66fcf24319a38a4ce4afebd1cc2', '2026-05-14 10:22:55', 1, 'AP3A.240905.015.A2', '2026-04-14 10:22:55'),
(46, 2, '2475da0a39565dbd0bfdb61ee8ab871d255fbc3b77ab495948eb70ccca455826', '2026-05-14 10:25:50', 1, 'AP3A.240905.015.A2', '2026-04-14 10:25:50'),
(47, 2, '0f25a9bb39f00de6443a3472f1dbd2ee61ae054f84157cddd0918151b536dc5d', '2026-05-14 10:30:55', 1, 'AP3A.240905.015.A2', '2026-04-14 10:30:55'),
(48, 2, '52567c53f97cacb62a3b50af6037cbac5b28a99818bf9fb2debc929bbdf06045', '2026-05-14 10:32:08', 1, 'AP3A.240905.015.A2', '2026-04-14 10:32:08'),
(49, 2, 'a06fc2681205e561976006ef1f875f7927c61ec5c322f54c51a8fcb23c2c9183', '2026-05-14 10:37:49', 1, 'AP3A.240905.015.A2', '2026-04-14 10:37:50'),
(50, 2, '5cbd9fba5a4887218dd690c8bda51ed34ca8bf510a91b7b76a1a2e4021db8575', '2026-05-14 10:39:56', 1, 'AQ3A.240929.001', '2026-04-14 10:39:56'),
(51, 2, 'cf834fc6f825bac131fc1c261248d5bc8dedc6bb25489c8864292bfbfb7c813c', '2026-05-14 10:42:41', 1, 'AQ3A.240929.001', '2026-04-14 10:42:41'),
(52, 2, '77fe3fb16296c6e4fce03ee45ff1bfdc0ad01d0c7cc76d6bffe31daeaa5e6693', '2026-05-14 10:43:20', 1, 'AQ3A.240929.001', '2026-04-14 10:43:20'),
(53, 2, '8ef366925dfc9e9c6bcc67686cdb75a30ad2489c8f11c80a4f7899e5db9f2483', '2026-05-14 10:44:45', 1, 'AQ3A.240929.001', '2026-04-14 10:44:45'),
(54, 2, '8d0b9ed3cf161b158f88afff5ec2c26cb6e9276e5c8e9fd51bf4a24b1f07e28d', '2026-05-14 10:48:29', 1, 'AQ3A.240929.001', '2026-04-14 10:48:29'),
(55, 2, '3e1dbea97ec5935eb80a168a0d1c71536c244a1e9d5afdcf8d24a0e9faef68ca', '2026-05-14 10:50:19', 1, 'AQ3A.240929.001', '2026-04-14 10:50:19'),
(56, 1, '69c67fed54e3179ba63306943194655cd8504d8fa67c99e7a17da6f794e9e45f', '2026-05-14 10:50:44', 1, 'AQ3A.240929.001', '2026-04-14 10:50:44'),
(57, 2, 'db76302ed3bcd0b0b1b7a3fa40bae2e7c42fd080be8773828c5617f256e4f96c', '2026-05-14 10:53:51', 1, 'AP3A.240905.015.A2', '2026-04-14 10:53:51'),
(58, 1, 'd36ca5411bdc51b86c691dc3982ded9445010ee2aeaef4a35ef0456ae23e9557', '2026-05-14 10:54:54', 1, 'AQ3A.240929.001', '2026-04-14 10:54:54'),
(59, 2, '3d7c9cd12301ada2754af0394e460d4abde8c096623ace06b905e3611f11804d', '2026-05-14 11:09:13', 1, 'AP3A.240905.015.A2', '2026-04-14 11:09:13'),
(60, 1, 'd79acdd1dfb1522b59a13fd27bfac25f7313377743a073b0d7e3829b93df2bf4', '2026-05-14 11:23:32', 1, 'AQ3A.240929.001', '2026-04-14 11:23:32'),
(61, 1, '802879052e17470abb08a946baf604e37ca189a49d035f9d0564cf6f16e9fc30', '2026-05-14 11:43:09', 1, 'AQ3A.240929.001', '2026-04-14 11:43:09'),
(62, 1, '1a1a66c0e446e193b0bf1995b2d5d3bfdcc3d685ce837df86a149decc26d9571', '2026-05-14 11:51:47', 0, 'AQ3A.240929.001', '2026-04-14 11:51:47'),
(63, 2, '8424294b06624b34c0226030b719feb222b48c5d1ad7b5c62fd400a0da2fc3f1', '2026-05-14 11:53:25', 1, 'AP3A.240905.015.A2', '2026-04-14 11:53:25'),
(64, 2, '836af9067c8eb1910340e7f3775c714d40204b6481fb8b51a43b20ff5986efab', '2026-05-14 12:26:59', 1, 'AP3A.240905.015.A2', '2026-04-14 12:26:59'),
(65, 3, '73664103d43ccf24463352554de234e5beb6f6d100046d08db9abda5123b068d', '2026-05-14 12:37:56', 1, 'AQ3A.240929.001', '2026-04-14 12:37:56'),
(66, 2, '109c080daa49c1a3157fc53a454eea9fd2c0ebe063af1b693beec7489555552e', '2026-05-14 12:44:06', 1, 'AP3A.240905.015.A2', '2026-04-14 12:44:06'),
(67, 3, '6fcc247d44ae489c80c887358aa82ce91fe03ee54a9910f4ee4382eaf6004477', '2026-05-14 12:54:47', 1, 'AQ3A.240929.001', '2026-04-14 12:54:47'),
(68, 2, 'd29c4777e6a0c6df99db8a179b8d7d153defb170e376c0ef6021c49d835130e5', '2026-05-14 13:00:52', 1, 'AP3A.240905.015.A2', '2026-04-14 13:00:52'),
(69, 2, '2d197cf9c6f4e6b09773dfe8bc71c7f33cfb196833eb9a5d5e38cf066f6a72e5', '2026-05-14 13:04:51', 1, 'AP3A.240905.015.A2', '2026-04-14 13:04:51'),
(70, 6, '7e369c888bc59c88e3f9e500fd67e7e3bb4185f6c6205f1f9225d11a35827d13', '2026-05-14 13:05:26', 1, 'AP3A.240905.015.A2', '2026-04-14 13:05:26'),
(71, 6, '66962c0298c69b1a502f4078d8d8bb1743d36e9a68116134dd9cf41f594b921e', '2026-05-14 13:05:30', 0, NULL, '2026-04-14 13:05:30'),
(72, 6, 'fee19b616a17c920ee437b6e0b792c0524ccb8608a8694821fa5dc845c796b08', '2026-05-14 13:05:38', 0, NULL, '2026-04-14 13:05:38'),
(73, 6, '7a5cb017095ce7f97658ff93de7baa750e746f018e6a9a6cb6b051ab74cadcd4', '2026-05-14 13:15:03', 1, 'AP3A.240905.015.A2', '2026-04-14 13:15:03'),
(74, 6, 'efa9b54ecfa3d43a96d018944b67e420ef1f91396dea34426982305db2bfc8b5', '2026-05-14 13:18:35', 1, 'AQ3A.240929.001', '2026-04-14 13:18:35'),
(75, 6, 'ef6b66218438ddbeaae6e37687dfc7fb4f0b0a22feffb145d448fa4581987f50', '2026-05-14 13:18:53', 0, NULL, '2026-04-14 13:18:53'),
(76, 6, 'f4cc4a5c48d8052eb02e2504f5fd2ee5366de200038be288cc20ac37f643bc55', '2026-05-14 13:18:59', 0, NULL, '2026-04-14 13:18:59'),
(77, 6, 'bea4abccd5fd7537146f1133e2fab6b6cef81431177121898033234e41e9bab3', '2026-05-14 13:20:48', 1, 'AQ3A.240929.001', '2026-04-14 13:20:48'),
(78, 6, 'b89ad96662a3dcb23c944a03e3a0c71af6a514e3cd744b49a8abccd59d0f38ab', '2026-05-14 13:23:20', 1, 'AQ3A.240929.001', '2026-04-14 13:23:20'),
(79, 6, '86013538e43f00b25da602d9b1a0777ee7a8543e580631ad2fa6afd0dcec434a', '2026-05-14 13:28:59', 0, NULL, '2026-04-14 13:28:59'),
(80, 2, '61bdf326575ab77fed8be8b2768c47b2651dec4b5a0f3ae6c5329b8e97eb74fe', '2026-05-14 13:31:37', 1, 'AP3A.240905.015.A2', '2026-04-14 13:31:37'),
(81, 3, 'a90d225ad026c96a757b4a171c686d7c7032b0440a145aee73482ede98a4be54', '2026-05-14 13:32:51', 1, 'AQ3A.240929.001', '2026-04-14 13:32:51'),
(82, 3, 'b6145141cf7fe7d26868db8df13404951968a5e48d4ca5dc3be96c7e9a70a72f', '2026-05-14 13:39:52', 0, 'UnknownDevice', '2026-04-14 13:39:52'),
(83, 6, '2a2e5d4f1d0f56737807ed7839b14b015eebc127fad3e01ad4f58c2df8d192d8', '2026-05-14 13:46:24', 1, 'AP3A.240905.015.A2', '2026-04-14 13:46:24'),
(84, 6, '64f708f7b3d277c4c7e3e59beb6a230fcddbaddfbd0018bd78b4312bccbff4b2', '2026-05-14 13:47:16', 0, 'AP3A.240905.015.A2', '2026-04-14 13:47:16'),
(85, 7, '6734a8dac4733c1ec53fd5b48075f9ca3c0a206e800aa50a31befc906b50944e', '2026-05-14 14:19:11', 1, 'AQ3A.240929.001', '2026-04-14 14:19:11'),
(86, 7, 'f99014167d38194c335596649c009d27a898bb1ffbcdcee174259fe40b98ff64', '2026-05-14 14:19:14', 0, NULL, '2026-04-14 14:19:14'),
(87, 7, '36ecbb3c6f59253cce5c68000282eb729777ec1b6f56525cc9e0f0817cce67f5', '2026-05-14 14:34:33', 1, 'AQ3A.240929.001', '2026-04-14 14:34:33'),
(88, 8, '3ddcbcbaea5545da045b1ed101c7d5bcaa676f656b837230c32f60f0d9dc0f10', '2026-05-14 14:35:03', 0, 'AQ3A.240929.001', '2026-04-14 14:35:03'),
(89, 8, '20302cc230bbf2905c36d98a943f44025e15b8910844365110e9baf5b028012b', '2026-05-14 14:35:06', 0, NULL, '2026-04-14 14:35:06'),
(90, 7, 'cbfaac026b88286f6cd9ec3030e47ee0053952cbfc9627d8c5dbe5c921be375c', '2026-05-14 18:17:45', 0, 'AQ3A.240929.001', '2026-04-14 18:17:45'),
(91, 6, 'c3b05e78b68c0f93899e6b7a77b243f308bcb61723c3dc44b9a491f0d6fd479e', '2026-05-14 18:19:06', 1, 'AQ3A.240929.001', '2026-04-14 18:19:06'),
(92, 6, 'b84777e0b68ff6ac60da88d0a43ad3389765ca6508f142f6cacd0cd513e6a7be', '2026-05-14 18:45:51', 1, 'AQ3A.240929.001', '2026-04-14 18:45:51'),
(93, 6, '6ff692afc025a9fd118293608dd46588ae51a57f3ae2bd2b47bc7e9a9a25d25c', '2026-05-14 21:01:11', 1, 'AQ3A.240929.001', '2026-04-14 21:01:11'),
(94, 6, 'c37a6aa17ca2e80173da959cb737c894170d0709a76751e3bfde608bc741de61', '2026-05-14 21:18:22', 1, 'AQ3A.240929.001', '2026-04-14 21:18:22'),
(95, 6, 'd209dc81763387c4cca39dded0d668f194874ec4a9cbc609277fa6c4fe695ff2', '2026-05-14 21:18:58', 1, 'AQ3A.240929.001', '2026-04-14 21:18:58'),
(96, 6, 'b1c1257d1efdbea3490106e333db86042304a8244703b8d1489ebb916f5ba924', '2026-05-14 21:27:00', 1, 'AQ3A.240929.001', '2026-04-14 21:27:00'),
(97, 6, 'bf33cbe52be8dd68a8679eb7f9c3b475ba34954173d242cc5608de66521319e1', '2026-05-14 21:45:16', 1, 'AQ3A.240929.001', '2026-04-14 21:45:16'),
(98, 3, '440266359895f1f46f66ec1e874b6960e4b7bfa5e01074e54f91df5ded1de37e', '2026-05-14 21:57:31', 1, 'AQ3A.240929.001', '2026-04-14 21:57:31'),
(99, 2, '2e62bae0aefc361ef2a0d48cefa827c891ee58b0bd7665b3ffd41a475b126c58', '2026-05-14 22:06:40', 0, 'AP3A.240905.015.A2', '2026-04-14 22:06:40'),
(100, 6, '40a50f38da572bded6971dca2bee9ac5deba4d50f6f01a5bea0cda4428f50257', '2026-05-14 23:04:22', 1, 'AQ3A.240929.001', '2026-04-14 23:04:22'),
(101, 6, '8e1dd11c2a48dbeb458e265a534fc90272b2b5717bf33ba4e10e2c5a154eadab', '2026-05-14 23:12:30', 1, 'AQ3A.240929.001', '2026-04-14 23:12:30'),
(102, 9, '8fcf1c77f16133b7632ca8600d28372e41916c25bb3bd6ccf4b5d8a8146d20ea', '2026-05-15 00:05:08', 1, 'AQ3A.240929.001', '2026-04-15 00:05:08'),
(103, 9, '9eb4872495136b36925140dcb0d563e9a136c16e947297a4a82575cac3a47751', '2026-05-15 00:05:11', 0, NULL, '2026-04-15 00:05:11'),
(104, 9, '25e9709cecb0d7e73aa681d8fb19efe4208015a54da19e0d94bd95de6790c58f', '2026-05-15 00:06:02', 0, NULL, '2026-04-15 00:06:02'),
(105, 9, '625c2cfff7968f7796932102cb28773f42f87cf2973c98373f57e9efb33abc5a', '2026-05-15 00:08:34', 1, 'AQ3A.240929.001', '2026-04-15 00:08:34'),
(106, 9, 'eca415bf71232e91dfd10726f6d8681b3af45d5b637848ae9b80c445a1541327', '2026-05-15 00:09:07', 1, 'AQ3A.240929.001', '2026-04-15 00:09:07'),
(107, 9, '253bc0960cb7434da623e96184311e2bc6e99eddd5c30f19f12e0aa26a06e5ce', '2026-05-15 00:09:49', 1, 'AQ3A.240929.001', '2026-04-15 00:09:49'),
(108, 9, 'a588f8e6ff518161433302880c122e0e4e750e4fce6526743971e27865621987', '2026-05-15 00:10:22', 1, 'AQ3A.240929.001', '2026-04-15 00:10:22'),
(109, 9, '85b1544b642017a022e2be6ad836ad07f92b47f93afd4fa9855f710709ed9cfa', '2026-05-15 00:11:53', 1, 'AQ3A.240929.001', '2026-04-15 00:11:53'),
(110, 9, '9131d75ae62b8504652da2902cc14802ca645e9ba6a7353a370d0c017539ddab', '2026-05-15 00:13:45', 1, 'AQ3A.240929.001', '2026-04-15 00:13:45'),
(111, 6, '7ea660d1e0b3e1ec155ba598a4111e4155639a1e31818d775406106ae84ddd7a', '2026-05-15 00:14:05', 1, 'AQ3A.240929.001', '2026-04-15 00:14:05'),
(112, 2, 'd873a330604e948838917ed62ae07635f1f6ea05e36b34a86ffa2fc478f68d30', '2026-05-15 00:17:49', 1, 'AQ3A.240929.001', '2026-04-15 00:17:49'),
(113, 6, 'fa0728748b1cbf9baa687c14bcbe33e9d91ce173da6b21017ffd98677026c20e', '2026-05-15 00:20:03', 1, 'AQ3A.240929.001', '2026-04-15 00:20:03'),
(114, 6, 'e6e156531db13515030dc6a7c4a67197b5329b94f7987e9d49295010e2cf585b', '2026-05-15 00:30:35', 1, 'android-a063-unknown', '2026-04-15 00:30:35'),
(115, 10, '4a09a44118426cc5fec2266afd6509d905bb600245da8f4ad3fee28a6aa8ba57', '2026-05-15 00:31:57', 1, 'AQ3A.240929.001', '2026-04-15 00:31:57'),
(116, 10, '3d5b61f38c2a443d0c1ec2f0ffb7d1929c9b7c018f4e7a9ee34a7f510903c0be', '2026-05-15 00:31:59', 0, NULL, '2026-04-15 00:31:59'),
(117, 10, 'd63fc4c207fcd48b4fc9c78980bb46738bd9d8dd68741e58b8b05d19fa290512', '2026-05-15 00:32:27', 0, 'AQ3A.240929.001', '2026-04-15 00:32:27'),
(118, 10, '19994c8bfa37372fef4467a7b97b3d1fdeb59716935332b366026814a2e8c8d1', '2026-05-15 00:32:29', 0, NULL, '2026-04-15 00:32:29'),
(119, 10, 'df04214776380b3e454da326d46a0523ae8a5f15c444caf7f549ab61b469d88a', '2026-05-15 00:32:37', 0, NULL, '2026-04-15 00:32:37'),
(120, 10, '217b71717a54aad112ba9cc323b568e7637990bf39436b9e6fced963b70f6eff', '2026-05-15 00:32:46', 0, NULL, '2026-04-15 00:32:46'),
(121, 6, 'c76f78f72b3b06a8658606e5ae69a253dd4da665360a74cd2199223883419eb3', '2026-05-15 00:33:44', 1, 'AQ3A.240929.001', '2026-04-15 00:33:44'),
(122, 2, '5621e95e0f63796d50e58da1169764dc1622f17fe7e423544d92c7ec1b2699c0', '2026-05-15 00:42:06', 1, 'AQ3A.240929.001', '2026-04-15 00:42:06'),
(123, 6, '846a9db3f2a31f52fb1898fcb2d4bc88bfc9ddb8e81625b8d0e631057f1444f0', '2026-05-15 11:57:01', 1, 'AQ3A.240929.001', '2026-04-15 11:57:01'),
(124, 6, 'f24ca6f619e72b59819ea9bffc676dc4d6c304b831d725ee21b130a6fae41d4d', '2026-05-15 11:57:12', 0, 'android-a063-unknown', '2026-04-15 11:57:12'),
(125, 9, 'fc2c3a639b2499c95ca3a1bbff0010647f0f5f1a76e946f4ace30b44410b6a73', '2026-05-15 11:58:53', 1, 'AQ3A.240929.001', '2026-04-15 11:58:53'),
(126, 9, 'bace6456388c0d4bfe458a59e4a6fef619f2ee93f79ed0141b1d2b4ade55b59c', '2026-05-15 11:59:40', 1, 'android-a063-unknown', '2026-04-15 11:59:40'),
(127, 9, '901f1fe7cbf6c5dc815c11d4433680a1a86041456f3431bacb59c36063624154', '2026-05-15 12:00:21', 1, 'android-a063-unknown', '2026-04-15 12:00:21'),
(128, 9, '00a29557535d37a7dc3e40d0c8fa373b429ee3d6a889ac6b6185d5316812846c', '2026-05-15 12:00:39', 0, 'android-a063-unknown', '2026-04-15 12:00:39'),
(129, 2, 'a36e4811e6b31bf9c3f7aa09364459384819572d6f222d40c36f9048007c7734', '2026-05-15 12:00:58', 1, 'AQ3A.240929.001', '2026-04-15 12:00:58'),
(130, 9, 'a045df29f8d2cef6b90e838ea07e76942736262ba8a28970b5291a168789e5aa', '2026-05-15 12:03:58', 0, 'AQ3A.240929.001', '2026-04-15 12:03:58'),
(131, 11, '3c406acaa3a90c447a3cf024ec218d3969eabe0544e46b2988d4ed94bd82eba5', '2026-05-15 12:05:33', 1, 'AQ3A.240929.001', '2026-04-15 12:05:33'),
(132, 11, 'e518329b7f53417256426d1ca041ae86dd06dda537fa64aef7dc1247765a64ba', '2026-05-15 12:08:05', 1, 'AQ3A.240929.001', '2026-04-15 12:08:05'),
(133, 6, '595d5ce8d7f74b256520d1fad27a68613b67dd895baa1d74bba1ae96704464d1', '2026-05-15 12:46:30', 1, 'AQ3A.240929.001', '2026-04-15 12:46:30'),
(134, 11, '3f207295a7fa94716e6af2bce2dcad2133c72ae7a027f6f22095094de7f1ad3a', '2026-05-15 14:37:43', 1, 'AQ3A.240929.001', '2026-04-15 14:37:43'),
(135, 11, '8a89db3a65b925868dd10270e22f433c9680e386f4a72cb5b5f23b93573f6ec2', '2026-05-15 14:37:47', 0, NULL, '2026-04-15 14:37:47'),
(136, 11, '29c9f2e2c70195f38d842b6751d5f0ede957f57624dbfff7bb4e4994ea2402c6', '2026-05-15 14:40:02', 0, 'AQ3A.240929.001', '2026-04-15 14:40:02'),
(137, 6, 'a9b63bd5802db13df0bc3c40cdd7c13bf64b8efd1dd1eb8e6854e1a658a4149c', '2026-05-15 14:40:21', 1, 'AQ3A.240929.001', '2026-04-15 14:40:21'),
(138, 3, '704f2e19c2b2902d7b6b0c939b1ed9d00c64ba2714c96209277641a50d1db2e7', '2026-05-15 14:49:47', 1, 'AQ3A.240929.001', '2026-04-15 14:49:47'),
(139, 3, '8c6b861aa4cc8c178e9c2c3aa8c7c993837f63f9a785949906e282d6e7c51094', '2026-05-15 14:50:35', 0, 'android-a063-unknown', '2026-04-15 14:50:35'),
(140, 3, 'e1df8078ddf01c05a214dead0a168f5f6bd2e77088827e67a83850acec3c9c42', '2026-05-15 15:37:29', 0, 'AQ3A.240929.001', '2026-04-15 15:37:29'),
(141, 6, 'f3403a71f89b09b5b933d041402319e6ab83e88cf2f1fd5d08ba8e840b04f975', '2026-05-15 15:51:08', 1, 'AQ3A.240929.001', '2026-04-15 15:51:08'),
(142, 2, '9d466c8889b6597743f991f0bcd61bbc282068799fa7e499f6d0e167591c005f', '2026-05-15 15:52:43', 0, 'AQ3A.240929.001', '2026-04-15 15:52:43'),
(143, 6, 'e0517cf5e891b21624d702c090d897fa492008a754b123e4d7a7fa6b1a48880a', '2026-05-15 15:55:29', 0, 'AQ3A.240929.001', '2026-04-15 15:55:29');

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `payment_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(20) NOT NULL DEFAULT 'upi' COMMENT 'UPI ONLY (business rule)',
  `reason` varchar(200) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | processing | completed | failed',
  `upi_txn_id` varchar(100) DEFAULT NULL,
  `initiated_by` bigint(20) UNSIGNED DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedule_templates`
--

CREATE TABLE `schedule_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `slot_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Standard slot definitions for this template type' CHECK (json_valid(`slot_json`)),
  `instant_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `scheduled_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shops`
--

CREATE TABLE `shops` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `slug` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `alternate_phone` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `delivery_radius_km` decimal(5,2) NOT NULL DEFAULT 5.00,
  `min_order_value` decimal(8,2) NOT NULL DEFAULT 0.00,
  `max_orders_per_day` int(11) DEFAULT 100,
  `avg_rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `total_ratings` int(11) NOT NULL DEFAULT 0,
  `total_orders` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'in_progress' COMMENT 'in_progress|pending_review|active|suspended|rejected',
  `onboarding_status` varchar(20) NOT NULL DEFAULT 'in_progress',
  `shop_type` varchar(30) NOT NULL DEFAULT 'water_tanker' COMMENT 'individual|agency|distributor|water_tanker|ro_plant|both',
  `is_open` tinyint(1) NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verified_at` datetime DEFAULT NULL,
  `logo_url` varchar(2048) DEFAULT NULL,
  `banner_url` varchar(2048) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `bank_account_no` varchar(20) DEFAULT NULL,
  `bank_ifsc` varchar(11) DEFAULT NULL,
  `onboarding_completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `bank_statement_url` varchar(2048) DEFAULT NULL,
  `bank_statement_password` varchar(100) DEFAULT NULL,
  `owner_name` varchar(150) DEFAULT NULL,
  `brand_name` varchar(150) DEFAULT NULL,
  `business_experience` varchar(100) DEFAULT NULL,
  `is_self_delivery` tinyint(1) NOT NULL DEFAULT 1,
  `referred_by_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `fssai_no` varchar(20) DEFAULT NULL,
  `pan_no` varchar(10) DEFAULT NULL,
  `aadhar_no` varchar(12) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_branch` varchar(100) DEFAULT NULL,
  `account_holder_name` varchar(150) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shops`
--

INSERT INTO `shops` (`id`, `uuid`, `owner_user_id`, `name`, `slug`, `description`, `phone`, `alternate_phone`, `email`, `address_line1`, `address_line2`, `city`, `state`, `pincode`, `latitude`, `longitude`, `delivery_radius_km`, `min_order_value`, `max_orders_per_day`, `avg_rating`, `total_ratings`, `total_orders`, `status`, `onboarding_status`, `shop_type`, `is_open`, `is_verified`, `verified_at`, `logo_url`, `banner_url`, `gstin`, `bank_account_no`, `bank_ifsc`, `onboarding_completed_at`, `created_at`, `updated_at`, `upi_id`, `bank_statement_url`, `bank_statement_password`, `owner_name`, `brand_name`, `business_experience`, `is_self_delivery`, `referred_by_user_id`, `fssai_no`, `pan_no`, `aadhar_no`, `bank_name`, `bank_branch`, `account_holder_name`) VALUES
(2, 'ce031999-4097-4cb1-890e-0db4c1535b87', 1, 'Ugendran s', 'ugendran-s-1776101765080', NULL, '+918428882777', NULL, NULL, 'Chromepet, Pallavaram', NULL, 'Default', NULL, NULL, 12.9526161, 80.1271935, 5.00, 0.00, 100, 0.00, 0, 0, 'active', 'completed', 'individual', 0, 1, '2026-04-14 00:09:02', NULL, NULL, NULL, '215151', 'TWTSYS', '2026-04-14 00:09:02', '2026-04-13 23:06:05', '2026-04-14 00:09:02', 'gegsts', NULL, NULL, 'Ugendran s', 'Twgs', '5', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, '66c31356-5c96-4624-bec1-d0b25061bd8c', 4, 'Ugendran s', 'ugendran-s-1776108371541', NULL, '+916384548477', NULL, NULL, 'Pending Location', NULL, 'Default', NULL, NULL, 12.9536800, 80.1277013, 5.00, 0.00, 100, 0.00, 0, 0, 'active', 'completed', 'individual', 0, 1, '2026-04-14 01:25:27', NULL, NULL, NULL, '499444', 'YDHES', '2026-04-14 01:25:27', '2026-04-14 00:56:11', '2026-04-14 01:25:27', NULL, NULL, NULL, 'Ugendran s', 'Tests', '5', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 'e2bd5b15-8e3f-4821-916b-70e0b9759ea8', 5, 'Ugendran ', 'ugendran--1776110189591', NULL, '+919818181818', NULL, NULL, 'X45P+C4V Ambedkar Street, Chromepet', NULL, 'Chennai', NULL, NULL, 12.9586886, 80.1352970, 5.00, 0.00, 100, 0.00, 0, 0, 'active', 'completed', 'agency', 0, 1, '2026-04-14 01:30:35', NULL, NULL, NULL, '619191991111', 'HSHEHHE9393', '2026-04-14 01:30:35', '2026-04-14 01:26:29', '2026-04-14 01:30:35', 'tets#13id', NULL, NULL, 'Suresh', 'Hello worldd', '10', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, '877737c6-c2c4-4473-ad48-dff8f9eea73a', 6, 'UV', 'uv-1776153571486', NULL, '+916363636363', NULL, NULL, 'Pending Location', NULL, 'Default', NULL, NULL, 12.9536272, 80.1276318, 5.00, 0.00, 100, 0.00, 0, 0, 'active', 'completed', 'individual', 0, 1, '2026-04-14 13:32:20', NULL, NULL, NULL, '21848484', 'TETSS', '2026-04-14 13:32:20', '2026-04-14 13:29:31', '2026-04-15 11:58:01', NULL, NULL, NULL, 'Shop Uv', 'Bisleri ', '10', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, '1d6843f1-e205-4843-b151-8e5163e6447a', 11, 'Ugendran s', 'ugendran-s-1776244091970', NULL, '+918222222222', NULL, NULL, 'Pending Location', NULL, 'Default', NULL, NULL, 12.9894967, 80.2489122, 5.00, 0.00, 100, 0.00, 0, 0, 'pending_review', 'pending_review', 'individual', 0, 0, NULL, NULL, NULL, NULL, '6343311810114', 'AXIS829204', '2026-04-15 14:39:48', '2026-04-15 14:38:11', '2026-04-15 14:39:48', 'ugendran@okaxis', NULL, NULL, 'Suras', 'Suras', '5', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shop_onboarding_progress`
--

CREATE TABLE `shop_onboarding_progress` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `step_id` tinyint(3) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending|in_progress|completed|skipped|under_review|rejected',
  `admin_review_status` varchar(20) DEFAULT NULL COMMENT 'approved | rejected',
  `admin_notes` text DEFAULT NULL,
  `document_url` varchar(2048) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_onboarding_progress`
--

INSERT INTO `shop_onboarding_progress` (`id`, `shop_id`, `owner_user_id`, `step_id`, `status`, `admin_review_status`, `admin_notes`, `document_url`, `completed_at`, `metadata`, `created_at`, `updated_at`) VALUES
(2, 2, 1, 1, 'completed', 'approved', NULL, NULL, '2026-04-13 23:16:54', '{\"name\":\"Ugendran s\",\"owner_name\":\"Ugendran s\",\"phone\":\"+918428882777\",\"shop_type\":\"individual\",\"address_line1\":\"Chromepet, Pallavaram\",\"latitude\":12.952616060887657,\"longitude\":80.12719345219918,\"city\":\"Default\"}', '2026-04-13 23:06:05', '2026-04-13 23:16:54'),
(3, 2, 1, 2, 'completed', 'approved', NULL, NULL, '2026-04-14 00:08:52', '{\"shop_type\":\"individual\",\"brand_name\":\"Twgs\",\"business_experience\":\"5\"}', '2026-04-13 23:06:11', '2026-04-14 00:08:52'),
(4, 2, 1, 3, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_2_payment_setup_1776101789496_748ba8289a38ae87.pdf', '2026-04-14 00:08:57', '{\"bank_name\":\"Tests\",\"account_holder\":\"Tetsys\",\"bank_account_no\":\"215151\",\"bank_ifsc\":\"TWTSYS\",\"upi_id\":\"gegsts\",\"bank_statement_password\":\"\"}', '2026-04-13 23:06:29', '2026-04-14 00:08:57'),
(5, 2, 1, 4, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_2_verification_1776101831472_b6ac2fe010c5fd1d.jpg', '2026-04-14 00:08:55', '{\"0\":\"{\",\"1\":\"}\",\"id_provided\":true,\"photo_provided\":true}', '2026-04-13 23:07:11', '2026-04-14 00:08:55'),
(6, 2, 1, 5, 'completed', 'approved', NULL, NULL, '2026-04-14 00:08:46', '{\"is_self_delivery\":true}', '2026-04-13 23:07:14', '2026-04-14 00:08:46'),
(7, 2, 1, 6, 'under_review', NULL, NULL, '/uploads/shop_doc/SHOP_2_product_catalog_1776142164529_2610d3feaa0ddb60.jpg', '2026-04-14 10:21:59', '{\"products\":[{\"subcategory_id\":1,\"name\":\"20L Bubbletop Can\",\"price\":40,\"stock_quantity\":50,\"image_url\":\"/uploads/shop_doc/SHOP_2_product_catalog_1776142164529_2610d3feaa0ddb60.jpg\",\"is_available\":true,\"type\":\"WATER_CAN\"},{\"subcategory_id\":2,\"name\":\"10L Dispenser Can\",\"price\":40,\"stock_quantity\":50,\"image_url\":null,\"is_available\":true,\"type\":\"WATER_CAN\"},{\"subcategory_id\":3,\"name\":\"25L Commercial Can\",\"price\":40,\"stock_quantity\":50,\"image_url\":null,\"is_available\":true,\"type\":\"WATER_CAN\"}]}', '2026-04-13 23:21:08', '2026-04-14 10:21:59'),
(8, 3, 4, 1, 'completed', 'approved', NULL, NULL, '2026-04-14 01:25:19', '{\"name\":\"Ugendran s\",\"owner_name\":\"Ugendran s\",\"phone\":\"+916384548477\",\"shop_type\":\"individual\",\"address_line1\":\"Pending Location\",\"latitude\":12.95368,\"longitude\":80.1277013,\"city\":\"Default\"}', '2026-04-14 00:56:11', '2026-04-14 01:25:19'),
(9, 3, 4, 2, 'completed', 'approved', NULL, NULL, '2026-04-14 01:25:20', '{\"shop_type\":\"individual\",\"brand_name\":\"Tests\",\"business_experience\":\"5\"}', '2026-04-14 00:59:16', '2026-04-14 01:25:20'),
(10, 3, 4, 3, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_3_payment_setup_1776109493629_53e3a9c40cf83c61.pdf', '2026-04-14 01:25:22', '{\"bank_name\":\"Gekeles\",\"account_holder\":\"Hello\",\"bank_account_no\":\"499444\",\"bank_ifsc\":\"YDHES\",\"upi_id\":\"\",\"bank_statement_password\":\"\"}', '2026-04-14 01:14:53', '2026-04-14 01:25:22'),
(11, 3, 4, 4, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_3_verification_1776109900242_d4df01a293f8ed95.jpg', '2026-04-14 01:25:23', '{\"id_provided\":true,\"photo_provided\":true}', '2026-04-14 01:21:40', '2026-04-14 01:25:23'),
(12, 3, 4, 5, 'completed', 'approved', NULL, NULL, '2026-04-14 01:25:25', '{\"is_self_delivery\":true}', '2026-04-14 01:22:51', '2026-04-14 01:25:25'),
(13, 3, 4, 6, 'completed', 'approved', NULL, NULL, '2026-04-14 01:25:17', '{\"products\":[{\"subcategory_id\":1,\"name\":\"20L Bubbletop Can\",\"price\":40,\"stock_quantity\":50}]}', '2026-04-14 01:22:58', '2026-04-14 01:25:17'),
(14, 4, 5, 1, 'completed', 'approved', NULL, NULL, '2026-04-14 01:29:58', '{\"name\":\"Ugendran \",\"owner_name\":\"Suresh\",\"phone\":\"+919818181818\",\"shop_type\":\"individual\",\"address_line1\":\"X45P+C4V Ambedkar Street, Chromepet\",\"latitude\":12.9586886,\"longitude\":80.135297,\"city\":\"Chennai\"}', '2026-04-14 01:26:29', '2026-04-14 01:29:58'),
(15, 4, 5, 2, 'completed', 'approved', NULL, NULL, '2026-04-14 01:30:00', '{\"shop_type\":\"agency\",\"brand_name\":\"Hello worldd\",\"business_experience\":\"10\"}', '2026-04-14 01:27:02', '2026-04-14 01:30:00'),
(16, 4, 5, 3, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_4_payment_setup_1776110261199_46b6ed677fe56d30.pdf', '2026-04-14 01:30:02', '{\"bank_name\":\"Hello wordls\",\"account_holder\":\"Testcae \",\"bank_account_no\":\"619191991111\",\"bank_ifsc\":\"HSHEHHE93933\",\"upi_id\":\"tets#13id\",\"bank_statement_password\":\"\"}', '2026-04-14 01:27:41', '2026-04-14 01:30:02'),
(17, 4, 5, 4, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_4_verification_1776110301030_2cdaaa92f3553e96.jpg', '2026-04-14 01:30:05', '{\"id_provided\":true,\"photo_provided\":true}', '2026-04-14 01:27:54', '2026-04-14 01:30:05'),
(18, 4, 5, 5, 'completed', 'approved', NULL, NULL, '2026-04-14 01:30:06', '{\"is_self_delivery\":true}', '2026-04-14 01:27:57', '2026-04-14 01:30:06'),
(19, 4, 5, 6, 'under_review', NULL, NULL, '/uploads/shop_doc/SHOP_4_product_catalog_1776139672357_a5924496f39f8b70.jpg', '2026-04-14 09:38:05', '{\"products\":[{\"subcategory_id\":1,\"name\":\"20L Bubbletop Can\",\"price\":50,\"stock_quantity\":100,\"image_url\":\"/uploads/shop_doc/SHOP_4_product_catalog_1776139672357_a5924496f39f8b70.jpg\"}]}', '2026-04-14 01:28:33', '2026-04-14 09:38:05'),
(20, 5, 6, 1, 'completed', 'approved', NULL, NULL, '2026-04-14 13:31:47', '{\"name\":\"UV\",\"owner_name\":\"Shop Uv\",\"phone\":\"+916363636363\",\"shop_type\":\"individual\",\"address_line1\":\"Pending Location\",\"latitude\":12.9536272,\"longitude\":80.1276318,\"city\":\"Default\"}', '2026-04-14 13:29:31', '2026-04-14 13:31:47'),
(21, 5, 6, 2, 'completed', 'approved', NULL, NULL, '2026-04-14 13:31:57', '{\"shop_type\":\"individual\",\"brand_name\":\"Bisleri \",\"business_experience\":\"10\"}', '2026-04-14 13:29:43', '2026-04-14 13:31:57'),
(22, 5, 6, 3, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_5_payment_setup_1776153599567_3e7fd725d7b1257a.pdf', '2026-04-14 13:32:03', '{\"bank_name\":\"Yest\",\"account_holder\":\"Test\",\"bank_account_no\":\"21848484\",\"bank_ifsc\":\"TETSS\",\"upi_id\":\"\",\"bank_statement_password\":\"\"}', '2026-04-14 13:29:59', '2026-04-14 13:32:03'),
(23, 5, 6, 4, 'completed', 'approved', NULL, '/uploads/shop_doc/SHOP_5_verification_1776153618412_5c3c4e9d1414ea2f.jpg', '2026-04-14 13:32:07', '{\"id_provided\":true,\"photo_provided\":true}', '2026-04-14 13:30:18', '2026-04-14 13:32:07'),
(24, 5, 6, 5, 'completed', 'approved', NULL, NULL, '2026-04-14 13:32:12', '{\"is_self_delivery\":true}', '2026-04-14 13:30:21', '2026-04-14 13:32:12'),
(25, 5, 6, 6, 'under_review', NULL, NULL, '/uploads/shop_doc/SHOP_5_product_catalog_1776170964015_83064565657e4862.jpg', '2026-04-14 18:19:24', '{\"products\":[{\"subcategory_id\":1,\"name\":\"20L Bubbletop Can\",\"price\":40,\"stock_quantity\":50,\"type\":\"WATER_CAN\"}]}', '2026-04-14 13:30:27', '2026-04-14 18:19:24'),
(27, 7, 11, 1, 'under_review', NULL, NULL, NULL, '2026-04-15 14:38:12', '{\"name\":\"Ugendran s\",\"owner_name\":\"Suras\",\"phone\":\"+918222222222\",\"shop_type\":\"individual\",\"address_line1\":\"Pending Location\",\"latitude\":12.9894967,\"longitude\":80.2489122,\"city\":\"Default\"}', '2026-04-15 14:38:12', '2026-04-15 14:38:12'),
(28, 7, 11, 2, 'under_review', NULL, NULL, NULL, '2026-04-15 14:38:22', '{\"shop_type\":\"individual\",\"brand_name\":\"Suras\",\"business_experience\":\"5\"}', '2026-04-15 14:38:22', '2026-04-15 14:38:22'),
(29, 7, 11, 3, 'under_review', NULL, NULL, NULL, '2026-04-15 14:38:50', '{\"bank_name\":\"Axis \",\"account_holder\":\"Ugendran s\",\"bank_account_no\":\"6343311810114\",\"bank_ifsc\":\"AXIS829204\",\"upi_id\":\"ugendran@okaxis\",\"bank_statement_password\":\"\"}', '2026-04-15 14:38:50', '2026-04-15 14:38:50'),
(30, 7, 11, 4, 'under_review', NULL, NULL, '/uploads/shop_doc/SHOP_7_verification_1776244168870_bd6144a1a8b07651.jpg', '2026-04-15 14:39:28', '{\"id_provided\":true,\"photo_provided\":true}', '2026-04-15 14:39:28', '2026-04-15 14:39:28'),
(31, 7, 11, 5, 'under_review', NULL, NULL, NULL, '2026-04-15 14:39:31', '{\"is_self_delivery\":true}', '2026-04-15 14:39:31', '2026-04-15 14:39:31'),
(32, 7, 11, 6, 'under_review', NULL, NULL, NULL, '2026-04-15 14:39:46', '{\"products\":[{\"subcategory_id\":1,\"name\":\"20L Bubbletop Can\",\"price\":40,\"stock_quantity\":50,\"deposit_amount\":150,\"type\":\"WATER_CAN\"},{\"subcategory_id\":2,\"name\":\"10L Dispenser Can\",\"price\":40,\"stock_quantity\":50,\"deposit_amount\":150,\"type\":\"WATER_CAN\"},{\"subcategory_id\":7,\"name\":\"2L Individual Bottle\",\"price\":40,\"stock_quantity\":50,\"deposit_amount\":150,\"type\":\"NORMAL\"}]}', '2026-04-15 14:39:46', '2026-04-15 14:39:46');

-- --------------------------------------------------------

--
-- Table structure for table `shop_onboarding_steps`
--

CREATE TABLE `shop_onboarding_steps` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `step_key` varchar(50) NOT NULL,
  `title_en` varchar(100) NOT NULL,
  `title_ta` varchar(100) NOT NULL,
  `description_en` text DEFAULT NULL,
  `description_ta` text DEFAULT NULL,
  `screen_route` varchar(100) NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `requires_admin_review` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` tinyint(3) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_onboarding_steps`
--

INSERT INTO `shop_onboarding_steps` (`id`, `step_key`, `title_en`, `title_ta`, `description_en`, `description_ta`, `screen_route`, `is_mandatory`, `requires_admin_review`, `sort_order`, `created_at`) VALUES
(1, 'basic_details', 'Basic Details', 'அடிப்படை விவரங்கள்', 'Shop name, owner name, address, and GPS location.', 'கடையின் பெயர், உரிமையாளர் பெயர், முகவரி மற்றும் ஜிபிஎஸ் இருப்பிடம்.', '/onboarding/shop/basic-details', 1, 1, 1, '2026-04-13 21:30:25'),
(2, 'business_info', 'Business Information', 'வணிகத் தகவல்', 'Shop type, brand (optional), and experience.', 'கடை வகை, பிராண்ட் (விருப்பத்தேர்வு) மற்றும் அனுபவம்.', '/onboarding/shop/business-info', 1, 1, 2, '2026-04-13 21:30:25'),
(3, 'payment_setup', 'Payments Setup', 'பணம் செலுத்துதல் அமைப்பு', 'Add UPI ID (optional) and bank details.', 'UPI ஐடி (விருப்பத்தேர்வு) மற்றும் வங்கி விவரங்களைச் சேர்க்கவும்.', '/onboarding/shop/bank', 1, 1, 3, '2026-04-13 21:30:25'),
(4, 'verification', 'Identity Verification', 'அடையாள சரிபார்ப்பு', 'Upload ID proof or shop photo (optional).', 'அடையாளச் சான்று அல்லது கடைப் புகைப்படத்தைப் பதிவேற்றவும் (விருப்பத்தேர்வு).', '/onboarding/shop/verification', 0, 1, 4, '2026-04-13 21:30:25'),
(5, 'delivery_setup', 'Delivery Configuration', 'விநியோக கட்டமைப்பு', 'Confirm self-delivery and manage delivery staff.', 'சுய விநியோகத்தை உறுதிசெய்து விநியோக ஊழியர்களை நிர்வகிக்கவும்.', '/onboarding/shop/delivery', 1, 1, 5, '2026-04-13 21:30:25'),
(6, 'product_catalog', 'Product Catalog', 'தயாரிப்பு பட்டியல்', 'Select items (20L/10L), set price, and update stock.', 'பொருட்களைத் தேர்ந்தெடுக்கவும் (20L/10L), விலையை நிர்ணயிக்கவும் மற்றும் இருப்பைப் புதுப்பிக்கவும்.', '/onboarding/shop/products', 1, 1, 6, '2026-04-13 21:30:25');

-- --------------------------------------------------------

--
-- Table structure for table `shop_schedule_exceptions`
--

CREATE TABLE `shop_schedule_exceptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `date` date NOT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT 0,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop_schedule_master`
--

CREATE TABLE `shop_schedule_master` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT 0,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop_schedule_slots`
--

CREATE TABLE `shop_schedule_slots` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `day_of_week` tinyint(3) UNSIGNED NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `max_orders` int(11) NOT NULL DEFAULT 10,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop_settings`
--

CREATE TABLE `shop_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `holiday_dates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`holiday_dates`)),
  `delivery_slots` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`delivery_slots`)),
  `slot_capacity` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`slot_capacity`)),
  `busy_mode` tinyint(1) NOT NULL DEFAULT 0,
  `auto_accept_orders` tinyint(1) NOT NULL DEFAULT 0,
  `order_acceptance_timeout` tinyint(3) UNSIGNED NOT NULL DEFAULT 15,
  `floor_charge_per_floor` decimal(6,2) NOT NULL DEFAULT 0.00,
  `emergency_order_premium` decimal(6,2) NOT NULL DEFAULT 0.00,
  `cod_limit` decimal(10,2) NOT NULL DEFAULT 10000.00,
  `delivery_charge_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`delivery_charge_config`)),
  `min_order_for_free_delivery` decimal(8,2) NOT NULL DEFAULT 0.00,
  `base_delivery_charge` decimal(6,2) NOT NULL DEFAULT 0.00,
  `delivery_charge_per_km` decimal(6,2) NOT NULL DEFAULT 0.00,
  `free_delivery_upto_km` decimal(5,2) NOT NULL DEFAULT 0.00,
  `allow_cod` tinyint(1) NOT NULL DEFAULT 1,
  `allow_online_payment` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` datetime NOT NULL,
  `is_manual_open` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Manually toggle shop open/closed regardless of schedule',
  `enable_instant_delivery` tinyint(1) NOT NULL DEFAULT 1,
  `enable_scheduled_delivery` tinyint(1) NOT NULL DEFAULT 1,
  `instant_cutoff_minutes` int(11) NOT NULL DEFAULT 60,
  `max_schedule_days` int(11) NOT NULL DEFAULT 7,
  `instant_max_orders` int(11) NOT NULL DEFAULT 20 COMMENT 'Max active instant orders before auto-disabling instant mode',
  `auto_disable_instant` tinyint(1) NOT NULL DEFAULT 1,
  `allowed_pincodes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of allowed pincodes e.g. [''600001'',''600002'']' CHECK (json_valid(`allowed_pincodes`)),
  `block_outside_pincode` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Block orders from pincodes not in allowed_pincodes',
  `surge_pricing_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of {start_time,end_time,extra_charge} surge windows' CHECK (json_valid(`surge_pricing_config`)),
  `surge_pricing_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `inventory_alert_threshold` int(11) NOT NULL DEFAULT 5 COMMENT 'Notify when full_cans stock falls below this value',
  `inventory_alert_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `cancellation_policy_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{ before_pickup_refund_pct, after_pickup_refund_pct, after_delivery_refund_pct, cancel_window_minutes }' CHECK (json_valid(`cancellation_policy_config`)),
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'GST / tax percentage applied on subtotal',
  `invoice_prefix` varchar(20) DEFAULT NULL COMMENT 'Custom invoice prefix e.g. TG-001',
  `show_in_listing` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Admin or shop can hide shop from customer listing',
  `is_featured` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Pinned to top of search results',
  `auto_assign_delivery` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Auto-assign nearest available delivery person',
  `delivery_auto_assign_strategy` varchar(20) NOT NULL DEFAULT 'nearest' COMMENT 'nearest | least_busy | round_robin',
  `notification_settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{ new_order: bool, cancellation: bool, payment_received: bool, low_stock: bool }' CHECK (json_valid(`notification_settings`)),
  `return_window_hours` int(11) NOT NULL DEFAULT 24 COMMENT 'Hours after delivery within which complaint/return is accepted',
  `replacement_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `weekly_schedule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{ mon: {open:''08:00'',close:''20:00'',closed:false}, tue: {...}, ... }' CHECK (json_valid(`weekly_schedule`)),
  `break_time_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{ start: ''13:00'', end: ''14:00'' } daily break window' CHECK (json_valid(`break_time_config`)),
  `min_order_amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `max_cod_cancel_allowed` tinyint(3) UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Max COD cancellations allowed before blocking COD for user',
  `auto_accept_scheduled` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Auto-accept scheduled orders only (instant still manual)',
  `staff_permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '{ manager: [''view_orders'',''edit_products'',''manage_settings''], staff: [''view_orders''] }' CHECK (json_valid(`staff_permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_settings`
--

INSERT INTO `shop_settings` (`id`, `shop_id`, `opening_time`, `closing_time`, `holiday_dates`, `delivery_slots`, `slot_capacity`, `busy_mode`, `auto_accept_orders`, `order_acceptance_timeout`, `floor_charge_per_floor`, `emergency_order_premium`, `cod_limit`, `delivery_charge_config`, `min_order_for_free_delivery`, `base_delivery_charge`, `delivery_charge_per_km`, `free_delivery_upto_km`, `allow_cod`, `allow_online_payment`, `updated_at`, `is_manual_open`, `enable_instant_delivery`, `enable_scheduled_delivery`, `instant_cutoff_minutes`, `max_schedule_days`, `instant_max_orders`, `auto_disable_instant`, `allowed_pincodes`, `block_outside_pincode`, `surge_pricing_config`, `surge_pricing_enabled`, `inventory_alert_threshold`, `inventory_alert_enabled`, `cancellation_policy_config`, `tax_percentage`, `invoice_prefix`, `show_in_listing`, `is_featured`, `auto_assign_delivery`, `delivery_auto_assign_strategy`, `notification_settings`, `return_window_hours`, `replacement_enabled`, `weekly_schedule`, `break_time_config`, `min_order_amount`, `max_cod_cancel_allowed`, `auto_accept_scheduled`, `staff_permissions`) VALUES
(2, 2, NULL, NULL, NULL, NULL, NULL, 0, 0, 15, 0.00, 0.00, 10000.00, NULL, 0.00, 0.00, 0.00, 0.00, 1, 1, '2026-04-13 23:06:05', 1, 1, 1, 60, 7, 20, 1, NULL, 0, NULL, 0, 5, 1, NULL, 0.00, NULL, 1, 0, 0, 'nearest', NULL, 24, 1, NULL, NULL, 0.00, 3, 0, NULL),
(3, 3, NULL, NULL, NULL, NULL, NULL, 0, 0, 15, 0.00, 0.00, 10000.00, NULL, 0.00, 0.00, 0.00, 0.00, 1, 1, '2026-04-14 00:56:11', 1, 1, 1, 60, 7, 20, 1, NULL, 0, NULL, 0, 5, 1, NULL, 0.00, NULL, 1, 0, 0, 'nearest', NULL, 24, 1, NULL, NULL, 0.00, 3, 0, NULL),
(4, 4, NULL, NULL, NULL, NULL, NULL, 0, 0, 15, 0.00, 0.00, 10000.00, NULL, 0.00, 0.00, 0.00, 0.00, 1, 1, '2026-04-14 01:26:29', 1, 1, 1, 60, 7, 20, 1, NULL, 0, NULL, 0, 5, 1, NULL, 0.00, NULL, 1, 0, 0, 'nearest', NULL, 24, 1, NULL, NULL, 0.00, 3, 0, NULL),
(5, 5, NULL, NULL, NULL, NULL, NULL, 0, 0, 15, 0.00, 0.00, 10000.00, NULL, 0.00, 0.00, 0.00, 0.00, 1, 1, '2026-04-14 13:29:31', 1, 1, 1, 60, 7, 20, 1, NULL, 0, NULL, 0, 5, 1, NULL, 0.00, NULL, 1, 0, 0, 'nearest', NULL, 24, 1, NULL, NULL, 0.00, 3, 0, NULL),
(7, 7, NULL, NULL, NULL, NULL, NULL, 0, 0, 15, 0.00, 0.00, 10000.00, NULL, 0.00, 0.00, 0.00, 0.00, 1, 1, '2026-04-15 14:38:11', 1, 1, 1, 60, 7, 20, 1, NULL, 0, NULL, 0, 5, 1, NULL, 0.00, NULL, 1, 0, 0, 'nearest', NULL, 24, 1, NULL, NULL, 0.00, 3, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `shop_staff`
--

CREATE TABLE `shop_staff` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | inactive | terminated',
  `joined_at` date NOT NULL,
  `left_at` date DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shop_wallets`
--

CREATE TABLE `shop_wallets` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `balance` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Current available balance (credited on delivery, debited on payout)',
  `pending_balance` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Amount in settlement pipeline but not yet transferred',
  `total_earned` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Lifetime gross earnings',
  `total_paid_out` decimal(14,2) NOT NULL DEFAULT 0.00 COMMENT 'Lifetime total paid to shop',
  `total_commission` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Lifetime platform commission deducted',
  `payout_mode` varchar(20) NOT NULL DEFAULT 'scheduled' COMMENT 'instant | scheduled | manual',
  `payout_cycle` varchar(10) NOT NULL DEFAULT 'weekly' COMMENT 'daily | weekly | biweekly | monthly',
  `bank_account_verified` tinyint(1) NOT NULL DEFAULT 0,
  `razorpay_fund_account_id` varchar(100) DEFAULT NULL COMMENT 'Razorpay fund account ID for payouts',
  `last_payout_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shop_wallets`
--

INSERT INTO `shop_wallets` (`id`, `shop_id`, `balance`, `pending_balance`, `total_earned`, `total_paid_out`, `total_commission`, `payout_mode`, `payout_cycle`, `bank_account_verified`, `razorpay_fund_account_id`, `last_payout_at`, `created_at`, `updated_at`) VALUES
(1, 5, 0.00, 0.00, 0.00, 0.00, 0.00, 'scheduled', 'weekly', 0, NULL, NULL, '2026-04-15 15:51:11', '2026-04-15 15:51:11');

-- --------------------------------------------------------

--
-- Table structure for table `staff_roles`
--

CREATE TABLE `staff_roles` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `role_name` varchar(30) NOT NULL COMMENT 'owner | manager | delivery | accountant',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  `description` varchar(200) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subcategories`
--

CREATE TABLE `subcategories` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_ta` varchar(100) NOT NULL,
  `image_url` varchar(2048) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `is_water_can` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subcategories`
--

INSERT INTO `subcategories` (`id`, `category_id`, `name_en`, `name_ta`, `image_url`, `is_active`, `sort_order`, `created_at`, `updated_at`, `is_water_can`) VALUES
(1, 1, '20L Bubbletop Can', '20லி பபுள்டாப் கேன்', NULL, 1, 1, '2026-04-13 23:20:45', '2026-04-14 10:14:00', 1),
(2, 1, '10L Dispenser Can', '10லி டிஸ்பென்சர் கேன்', NULL, 1, 2, '2026-04-13 23:20:45', '2026-04-14 10:14:00', 1),
(3, 1, '25L Commercial Can', '25லி வணிக கேன்', NULL, 1, 3, '2026-04-13 23:20:45', '2026-04-14 10:14:00', 1),
(4, 2, '1L Pack (12 Pcs)', '1லி பேக் (12 பானங்கள்)', NULL, 1, 1, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(5, 2, '500ml Pack (24 Pcs)', '500மி.லி பேக் (24 பானங்கள்)', NULL, 1, 2, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(6, 2, '5L Individual Jar', '5லி ஜார்', NULL, 1, 3, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(7, 2, '2L Individual Bottle', '2லி பாட்டில்', NULL, 1, 4, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(8, 3, 'Tabletop Manual Pump', 'டேபிள்டாப் பம்ப்', NULL, 1, 1, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(9, 3, 'Electric Standing Dispenser', 'எலக்ட்ரிக் டிஸ்பென்சர்', NULL, 1, 2, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(10, 3, 'Floor Standing Cabinet', 'ஸ்டாண்டிங் கேபினட்', NULL, 1, 3, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(11, 4, '5000L Mini Tanker', '5000லி மினி டேங்கர்', NULL, 1, 1, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(12, 4, '12000L Industrial Supply', '12000லி தொழில்முறை வழங்கல்', NULL, 1, 2, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0),
(13, 4, 'Corporate Event Supply', 'நிறுவன நிகழ்வு வழங்கல்', NULL, 1, 3, '2026-04-13 23:20:45', '2026-04-13 23:20:45', 0);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_pauses`
--

CREATE TABLE `subscription_pauses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `subscription_id` bigint(20) UNSIGNED NOT NULL,
  `pause_start` date NOT NULL,
  `pause_end` date NOT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `data_type` varchar(20) NOT NULL DEFAULT 'string' COMMENT 'string | number | boolean | json',
  `category` varchar(50) NOT NULL DEFAULT 'general' COMMENT 'payment | support | order | shop | system',
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tokens`
--

CREATE TABLE `tokens` (
  `id` int(11) NOT NULL,
  `token` text NOT NULL,
  `type` varchar(45) DEFAULT 'token',
  `expires_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_on` datetime NOT NULL DEFAULT current_timestamp(),
  `created_ip` varchar(45) DEFAULT NULL,
  `updated_on` datetime DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_ip` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `phone` varchar(15) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'guest' COMMENT 'guest | customer | shop_owner | delivery | admin',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | suspended | deleted',
  `profile_photo_url` varchar(2048) DEFAULT NULL,
  `loyalty_points` int(11) NOT NULL DEFAULT 0 COMMENT 'Spendable point balance',
  `referral_code` varchar(20) DEFAULT NULL,
  `fcm_token` text DEFAULT NULL,
  `preferred_language` varchar(5) NOT NULL DEFAULT 'en',
  `biometric_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_login_at` datetime DEFAULT NULL,
  `otp_code` varchar(255) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `otp_attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `onboarding_completed` tinyint(1) NOT NULL DEFAULT 0,
  `default_address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `current_level_id` int(10) UNSIGNED DEFAULT NULL,
  `referred_by_id` bigint(20) UNSIGNED DEFAULT NULL,
  `total_loyalty_points` bigint(20) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Lifetime points earned (for levels and badges)',
  `security_pin` varchar(255) DEFAULT NULL COMMENT 'Hashed/Encrypted PIN for app lock persistence',
  `security_pin_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `pin_attempts` int(11) NOT NULL DEFAULT 0,
  `pin_locked_until` datetime DEFAULT NULL,
  `security_verified_at` datetime DEFAULT NULL COMMENT 'Last time the user successfully verified PIN/Biometrics for the current session',
  `cod_cancel_count` tinyint(3) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Number of COD orders cancelled by this user (lifetime)',
  `cod_cancel_limit` tinyint(3) UNSIGNED NOT NULL DEFAULT 3 COMMENT 'Max COD cancellations allowed before COD is blocked',
  `cod_blocked` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'True when user has exceeded cod_cancel_limit',
  `upi_id` varchar(100) DEFAULT NULL,
  `has_active_platform_sub` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Cached flag — updated on subscription create/expire'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `uuid`, `phone`, `name`, `email`, `role`, `status`, `profile_photo_url`, `loyalty_points`, `referral_code`, `fcm_token`, `preferred_language`, `biometric_enabled`, `last_login_at`, `otp_code`, `otp_expires_at`, `otp_attempts`, `is_verified`, `onboarding_completed`, `default_address_id`, `created_at`, `updated_at`, `current_level_id`, `referred_by_id`, `total_loyalty_points`, `security_pin`, `security_pin_enabled`, `pin_attempts`, `pin_locked_until`, `security_verified_at`, `cod_cancel_count`, `cod_cancel_limit`, `cod_blocked`, `upi_id`, `has_active_platform_sub`) VALUES
(1, '5b41c638-0061-4d63-864a-295c3958820f', '+918428882777', 'User', NULL, 'shop_owner', 'active', NULL, 0, 'TG-D9C82F', NULL, 'en', 0, '2026-04-14 11:51:47', '$2b$10$RsHqbTQF9cVheb.3XKKKi.oJWxARtGS.vsmT2sZ4Fk1PE.90uEC8O', '2026-04-14 18:23:28', 0, 1, 1, NULL, '2026-04-13 22:53:01', '2026-04-14 18:18:28', NULL, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(2, '303b0a12-046b-4826-b41d-e051ecc30f34', '+919025815982', 'User', NULL, 'admin', 'active', NULL, 0, 'TG-E9C2E1', NULL, 'en', 0, '2026-04-15 15:52:43', '$2b$10$DmgfpjFl8C9f.NJW2g97juRsr4qIj0pOtYzZklE6NmM7X9YRyy4g.', '2026-04-15 15:57:33', 0, 1, 0, NULL, '2026-04-13 23:10:12', '2026-04-15 15:52:43', NULL, NULL, 0, NULL, 1, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(3, 'd48a2385-db9c-49ed-97cf-14c1a9871245', '+919876543210', 'Ugendran', 'mersalugendran12345@gmail.com', 'customer', 'active', NULL, 0, 'TG-947D1A', NULL, 'en', 1, '2026-04-15 15:37:29', '$2b$10$YH1c0nUD6w6nf4oYErFsteaU9UXsxl/xrE4hX.d6NsvUXFQbN103K', '2026-04-15 15:42:21', 0, 1, 1, 5, '2026-04-14 00:11:20', '2026-04-15 15:37:29', NULL, NULL, 0, '$2b$10$pUfAOGMMOImdg/fXjPP8l.DOfq.98GGUuUt00prkfPTEKBMyVUBGm', 1, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(4, '6766e1e7-f2e1-4b2e-9eaf-26d9a6b22db9', '+916384548477', 'User', NULL, 'shop_owner', 'active', NULL, 20, 'TG-1B1D32', NULL, 'en', 0, '2026-04-14 01:21:03', '$2b$10$RbJKkbuHHyOoHozXXemmvORHv.a8W.RP3fr3xQcOUsmwV0/jO7REK', '2026-04-14 01:25:54', 0, 1, 1, NULL, '2026-04-14 00:17:11', '2026-04-14 13:10:49', 41, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(5, '4e7ebf4d-36d5-42e2-80f9-48ced831d8fe', '+919818181818', 'User', NULL, 'shop_owner', 'active', NULL, 0, 'TG-67F207', NULL, 'en', 0, '2026-04-14 09:36:50', '$2b$10$VJ2ldi0uqQGg/CvdEYOJweBPicLZ2Fnu9ennxtlXlJMa9H4wSjMyi', '2026-04-14 09:41:35', 0, 1, 1, NULL, '2026-04-14 01:26:10', '2026-04-14 11:36:12', NULL, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(6, 'aabc9282-8f28-4de1-86f2-86efef2f5dbc', '+916363636363', 'Shop Uv', NULL, 'shop_owner', 'active', NULL, 0, 'TG-86AD02', NULL, 'en', 1, '2026-04-15 15:55:29', '$2b$10$NQYsmkjuMCtcSA3AQlMfguhykOEQXIs9U89tsH/xNCf2sBubIXdPm', '2026-04-15 16:00:11', 0, 1, 1, NULL, '2026-04-14 13:05:26', '2026-04-15 15:55:29', NULL, 4, 0, '$2b$10$0XyVV0eLe1P4xzxGQXlY..d7GZBTHC2kstwAr2WAi5VDwj8dmAol.', 1, 0, NULL, '2026-04-14 23:23:24', 0, 3, 0, NULL, 0),
(7, 'ed56d760-7c5a-4955-a29f-75cbf9c623f2', '+918888888888', 'Ugendran ', 'uga19082002@gmail.com', 'customer', 'active', NULL, 0, 'TG-0BC4E3', NULL, 'en', 0, '2026-04-14 18:17:44', '$2b$10$HImYgpAZt8hul7m9oETP8ugyWapZ8UriMlrz.v16I91qn0wCop/.e', '2026-04-14 18:22:22', 0, 1, 1, 13, '2026-04-14 14:19:11', '2026-04-14 18:17:44', NULL, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(8, '565cbfef-fba3-45cc-81a1-1c9760f9f7cd', '+917777777777', 'Sudeep', 'sudeep@gmail.con', 'customer', 'active', NULL, 0, 'TG-07C414', NULL, 'en', 0, '2026-04-14 14:35:03', '$2b$10$eZzPC0roBiSKO15y1m.aVOguzJoQVQU983DROJZ4bZXIYZ.k7OuMC', '2026-04-14 18:23:46', 0, 1, 1, 14, '2026-04-14 14:35:03', '2026-04-14 18:18:46', NULL, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(9, 'd8b219b7-9fc0-43ba-8967-582a7b452ef5', '+918111111111', 'Hari', 'ugendrantrading@gmail.com', 'customer', 'active', NULL, 0, 'TG-C6FCE4', NULL, 'en', 0, '2026-04-15 12:03:58', '$2b$10$FZ6B8HZsiOoUySeSVJ1v9O.bU11kJNVa44fY/PRfoql2ljYV090LS', '2026-04-15 12:08:48', 0, 1, 1, 15, '2026-04-15 00:05:08', '2026-04-15 12:03:58', NULL, NULL, 0, '$2b$10$gEDrX1h1398mLxxewwhn6eBScVo4v6AoTdEHUW3rf5BVpzF5.VJQW', 1, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(10, 'ed3247bf-5c5c-4f68-9bf0-7946b0522c51', '+916111111111', 'User', NULL, 'guest', 'active', NULL, 0, 'TG-049321', NULL, 'en', 0, '2026-04-15 00:32:27', '$2b$10$BlaGZ/B0sjDIlt2W1eYFOO0FwA89Pq1gzm.x6M4iTgSgGtWsc.1uu', '2026-04-15 00:37:20', 0, 1, 0, NULL, '2026-04-15 00:31:57', '2026-04-15 00:32:52', NULL, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0),
(11, 'c1487af8-cb66-427b-87b3-d83263cda8e3', '+918222222222', 'User', NULL, 'shop_owner', 'active', NULL, 0, 'TG-72914E', NULL, 'en', 0, '2026-04-15 14:40:02', '$2b$10$pMlbGT9EPyY4.EE1T1rPh.R0Zi8tkU2bSOqZZc2SxXTklk8QhY0TS', '2026-04-15 14:44:57', 0, 1, 0, NULL, '2026-04-15 12:05:33', '2026-04-15 14:40:02', NULL, NULL, 0, NULL, 0, 0, NULL, NULL, 0, 3, 0, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `user_devices`
--

CREATE TABLE `user_devices` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `device_id` varchar(255) NOT NULL COMMENT 'Unique hardware/app instance identifier from mobile device',
  `biometric_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_devices`
--

INSERT INTO `user_devices` (`id`, `user_id`, `device_id`, `biometric_enabled`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 6, 'android-a063-unknown', 1, '2026-04-15 11:57:38', '2026-04-14 23:46:48', '2026-04-15 11:57:38'),
(4, 9, 'android-a063-unknown', 1, '2026-04-15 12:00:05', '2026-04-15 00:06:38', '2026-04-15 12:00:05'),
(8, 3, 'android-a063-unknown', 1, '2026-04-15 14:50:37', '2026-04-15 14:50:37', '2026-04-15 14:50:37');

-- --------------------------------------------------------

--
-- Table structure for table `user_onboarding_progress`
--

CREATE TABLE `user_onboarding_progress` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `step_id` tinyint(3) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | in_progress | completed | skipped',
  `completed_at` datetime DEFAULT NULL,
  `skipped_at` datetime DEFAULT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_onboarding_progress`
--

INSERT INTO `user_onboarding_progress` (`id`, `user_id`, `step_id`, `status`, `completed_at`, `skipped_at`, `attempts`, `metadata`, `created_at`, `updated_at`) VALUES
(1, 3, 1, 'completed', '2026-04-14 00:11:58', NULL, 0, '{\"email\":\"mersalugendran12345@gmail.com\"}', '2026-04-14 00:11:58', '2026-04-14 00:11:58'),
(2, 3, 2, 'completed', '2026-04-14 00:12:06', NULL, 0, '{\"latitude\":12.953644,\"longitude\":80.127659,\"address\":\"6/7 , Chromepet\"}', '2026-04-14 00:12:06', '2026-04-14 00:12:06'),
(3, 7, 1, 'completed', '2026-04-14 14:26:41', NULL, 0, '{\"email\":\"uga19082002@gmail.com\"}', '2026-04-14 14:26:41', '2026-04-14 14:26:41'),
(4, 7, 2, 'completed', '2026-04-14 14:32:02', NULL, 0, '{\"latitude\":12.9535895,\"longitude\":80.1276133,\"address\":\"6/7 , Chromepet\"}', '2026-04-14 14:27:20', '2026-04-14 14:32:02'),
(5, 8, 1, 'completed', '2026-04-14 14:35:22', NULL, 0, '{\"email\":\"sudeep@gmail.con\"}', '2026-04-14 14:35:22', '2026-04-14 14:35:22'),
(6, 8, 2, 'completed', '2026-04-14 14:40:19', NULL, 0, '{\"latitude\":12.9535895,\"longitude\":80.1276133,\"address\":\"6/7 , Chromepet\"}', '2026-04-14 14:40:19', '2026-04-14 14:40:19'),
(7, 9, 1, 'completed', '2026-04-15 00:06:12', NULL, 0, '{\"email\":\"ugendrantrading@gmail.com\"}', '2026-04-15 00:06:12', '2026-04-15 00:06:12'),
(8, 9, 2, 'completed', '2026-04-15 00:06:19', NULL, 0, '{\"latitude\":12.9536794,\"longitude\":80.1276948,\"address\":\"2/9 1st Pillayar Koil Street, Chromepet\"}', '2026-04-15 00:06:19', '2026-04-15 00:06:19');

-- --------------------------------------------------------

--
-- Table structure for table `user_onboarding_steps`
--

CREATE TABLE `user_onboarding_steps` (
  `id` tinyint(3) UNSIGNED NOT NULL,
  `step_key` varchar(50) NOT NULL,
  `title_en` varchar(100) NOT NULL,
  `title_ta` varchar(100) NOT NULL,
  `description_en` text DEFAULT NULL,
  `description_ta` text DEFAULT NULL,
  `screen_route` varchar(100) NOT NULL,
  `icon_name` varchar(50) DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `is_skippable` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` tinyint(3) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_onboarding_steps`
--

INSERT INTO `user_onboarding_steps` (`id`, `step_key`, `title_en`, `title_ta`, `description_en`, `description_ta`, `screen_route`, `icon_name`, `is_mandatory`, `is_skippable`, `sort_order`, `created_at`) VALUES
(1, 'set_profile', 'Complete Your Profile', 'உங்கள் சுயவிவரத்தை பூர்த்தி செய்யுங்கள்', 'Add your name and email to get personalized updates.', 'தனிப்பயனாக்கப்பட்ட புதுப்பிப்புகளைப் பெற உங்கள் பெயர் மற்றும் மின்னஞ்சலைச் சேர்க்கவும்.', '/onboarding/customer/profile', 'person-outline', 1, 0, 1, '2026-04-13 21:30:25'),
(2, 'set_location', 'Primary Address', 'முதன்மை முகவரி', 'Set your delivery location to see nearby shops.', 'அருகிலுள்ள கடைகளைக் காண உங்கள் விநியோக இடத்தைத் அமைக்கவும்.', '/onboarding/customer/location', 'location-outline', 1, 0, 2, '2026-04-13 21:30:25');

-- --------------------------------------------------------

--
-- Table structure for table `user_platform_subscriptions`
--

CREATE TABLE `user_platform_subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `plan_id` int(10) UNSIGNED NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | expired | cancelled | paused | grace_period',
  `billing_cycle` varchar(10) NOT NULL DEFAULT 'monthly' COMMENT 'monthly | yearly',
  `amount_paid` decimal(8,2) NOT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT 1,
  `started_at` datetime NOT NULL,
  `expires_at` datetime NOT NULL COMMENT 'Subscription validity end date',
  `next_billing_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `razorpay_subscription_id` varchar(100) DEFAULT NULL,
  `razorpay_payment_id` varchar(100) DEFAULT NULL COMMENT 'Last successful payment ID',
  `free_deliveries_used` int(11) NOT NULL DEFAULT 0,
  `coupons_issued_this_cycle` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `benefit_reset_at` datetime DEFAULT NULL COMMENT 'Date when monthly counters were last reset',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_shop_stats`
--

CREATE TABLE `user_shop_stats` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `total_orders` int(11) NOT NULL DEFAULT 0,
  `total_spend` decimal(12,2) NOT NULL DEFAULT 0.00,
  `last_order_at` datetime DEFAULT NULL,
  `loyalty_level` enum('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_subscriptions`
--

CREATE TABLE `user_subscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `shop_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED DEFAULT NULL,
  `address_id` bigint(20) UNSIGNED DEFAULT NULL,
  `frequency` varchar(20) NOT NULL COMMENT 'daily | alternate_days | weekly | monthly',
  `quantity` int(11) NOT NULL DEFAULT 1,
  `delivery_slot` varchar(20) DEFAULT NULL COMMENT 'morning | afternoon | evening',
  `status` varchar(20) NOT NULL DEFAULT 'active' COMMENT 'active | paused | cancelled | expired',
  `next_delivery_at` datetime DEFAULT NULL,
  `started_at` datetime NOT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `total_orders_created` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `webhook_events`
--

CREATE TABLE `webhook_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_id` varchar(100) NOT NULL COMMENT 'Razorpay event.id — deduplication key',
  `event_type` varchar(50) NOT NULL COMMENT 'payment.captured | payment.failed | order.paid',
  `razorpay_order_id` varchar(50) DEFAULT NULL,
  `razorpay_payment_id` varchar(50) DEFAULT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Full webhook body — immutable log' CHECK (json_valid(`payload`)),
  `signature` varchar(255) NOT NULL COMMENT 'X-Razorpay-Signature header',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'TRUE after HMAC verification',
  `is_processed` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'TRUE after business logic executed',
  `processed_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `resolved_by` (`resolved_by`),
  ADD KEY `admin_reviewed_by` (`admin_reviewed_by`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `code_2` (`code`),
  ADD UNIQUE KEY `code_3` (`code`),
  ADD UNIQUE KEY `code_4` (`code`),
  ADD UNIQUE KEY `code_5` (`code`),
  ADD UNIQUE KEY `code_6` (`code`),
  ADD UNIQUE KEY `code_7` (`code`),
  ADD UNIQUE KEY `code_8` (`code`),
  ADD UNIQUE KEY `code_9` (`code`),
  ADD UNIQUE KEY `code_10` (`code`),
  ADD UNIQUE KEY `code_11` (`code`),
  ADD UNIQUE KEY `code_12` (`code`),
  ADD UNIQUE KEY `code_13` (`code`),
  ADD UNIQUE KEY `code_14` (`code`),
  ADD UNIQUE KEY `code_15` (`code`),
  ADD UNIQUE KEY `code_16` (`code`),
  ADD UNIQUE KEY `code_17` (`code`),
  ADD UNIQUE KEY `code_18` (`code`),
  ADD UNIQUE KEY `code_19` (`code`),
  ADD UNIQUE KEY `code_20` (`code`),
  ADD UNIQUE KEY `code_21` (`code`),
  ADD UNIQUE KEY `code_22` (`code`),
  ADD UNIQUE KEY `code_23` (`code`),
  ADD UNIQUE KEY `code_24` (`code`),
  ADD UNIQUE KEY `code_25` (`code`),
  ADD UNIQUE KEY `code_26` (`code`),
  ADD UNIQUE KEY `code_27` (`code`),
  ADD UNIQUE KEY `code_28` (`code`),
  ADD UNIQUE KEY `code_29` (`code`),
  ADD UNIQUE KEY `code_30` (`code`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `coupon_id` (`coupon_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `delivery_assignments`
--
ALTER TABLE `delivery_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `delivery_person_id` (`delivery_person_id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `delivery_persons`
--
ALTER TABLE `delivery_persons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `features_master`
--
ALTER TABLE `features_master`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`),
  ADD UNIQUE KEY `key_2` (`key`),
  ADD UNIQUE KEY `key_3` (`key`),
  ADD UNIQUE KEY `key_4` (`key`);

--
-- Indexes for table `feature_overrides`
--
ALTER TABLE `feature_overrides`
  ADD PRIMARY KEY (`id`),
  ADD KEY `feature_id` (`feature_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `generated_slots`
--
ALTER TABLE `generated_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_shop_date` (`shop_id`,`slot_date`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `loyalty_levels`
--
ALTER TABLE `loyalty_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `level_number` (`level_number`),
  ADD UNIQUE KEY `level_number_2` (`level_number`),
  ADD UNIQUE KEY `level_number_3` (`level_number`),
  ADD UNIQUE KEY `level_number_4` (`level_number`),
  ADD UNIQUE KEY `level_number_5` (`level_number`),
  ADD UNIQUE KEY `level_number_6` (`level_number`),
  ADD UNIQUE KEY `level_number_7` (`level_number`),
  ADD UNIQUE KEY `level_number_8` (`level_number`),
  ADD UNIQUE KEY `level_number_9` (`level_number`),
  ADD UNIQUE KEY `level_number_10` (`level_number`),
  ADD UNIQUE KEY `level_number_11` (`level_number`),
  ADD UNIQUE KEY `level_number_12` (`level_number`),
  ADD UNIQUE KEY `level_number_13` (`level_number`),
  ADD UNIQUE KEY `level_number_14` (`level_number`),
  ADD UNIQUE KEY `level_number_15` (`level_number`),
  ADD UNIQUE KEY `level_number_16` (`level_number`),
  ADD UNIQUE KEY `level_number_17` (`level_number`),
  ADD UNIQUE KEY `level_number_18` (`level_number`),
  ADD UNIQUE KEY `level_number_19` (`level_number`),
  ADD UNIQUE KEY `level_number_20` (`level_number`),
  ADD UNIQUE KEY `level_number_21` (`level_number`),
  ADD UNIQUE KEY `level_number_22` (`level_number`),
  ADD UNIQUE KEY `level_number_23` (`level_number`),
  ADD UNIQUE KEY `level_number_24` (`level_number`),
  ADD UNIQUE KEY `level_number_25` (`level_number`),
  ADD UNIQUE KEY `level_number_26` (`level_number`),
  ADD UNIQUE KEY `level_number_27` (`level_number`),
  ADD UNIQUE KEY `level_number_28` (`level_number`),
  ADD UNIQUE KEY `level_number_29` (`level_number`),
  ADD UNIQUE KEY `level_number_30` (`level_number`);

--
-- Indexes for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `loyalty_settings`
--
ALTER TABLE `loyalty_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD UNIQUE KEY `order_number_2` (`order_number`),
  ADD UNIQUE KEY `order_number_3` (`order_number`),
  ADD UNIQUE KEY `order_number_4` (`order_number`),
  ADD UNIQUE KEY `order_number_5` (`order_number`),
  ADD UNIQUE KEY `order_number_6` (`order_number`),
  ADD UNIQUE KEY `order_number_7` (`order_number`),
  ADD UNIQUE KEY `order_number_8` (`order_number`),
  ADD UNIQUE KEY `order_number_9` (`order_number`),
  ADD UNIQUE KEY `order_number_10` (`order_number`),
  ADD UNIQUE KEY `order_number_11` (`order_number`),
  ADD UNIQUE KEY `order_number_12` (`order_number`),
  ADD UNIQUE KEY `order_number_13` (`order_number`),
  ADD UNIQUE KEY `order_number_14` (`order_number`),
  ADD UNIQUE KEY `order_number_15` (`order_number`),
  ADD UNIQUE KEY `order_number_16` (`order_number`),
  ADD UNIQUE KEY `order_number_17` (`order_number`),
  ADD UNIQUE KEY `order_number_18` (`order_number`),
  ADD UNIQUE KEY `order_number_19` (`order_number`),
  ADD UNIQUE KEY `order_number_20` (`order_number`),
  ADD UNIQUE KEY `order_number_21` (`order_number`),
  ADD UNIQUE KEY `order_number_22` (`order_number`),
  ADD UNIQUE KEY `order_number_23` (`order_number`),
  ADD UNIQUE KEY `order_number_24` (`order_number`),
  ADD UNIQUE KEY `order_number_25` (`order_number`),
  ADD UNIQUE KEY `order_number_26` (`order_number`),
  ADD UNIQUE KEY `order_number_27` (`order_number`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `address_id` (`address_id`),
  ADD KEY `delivery_person_id` (`delivery_person_id`),
  ADD KEY `coupon_id` (`coupon_id`),
  ADD KEY `subscription_id` (`subscription_id`),
  ADD KEY `slot_id` (`slot_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `otp_logs`
--
ALTER TABLE `otp_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `razorpay_payment_id` (`razorpay_payment_id`),
  ADD UNIQUE KEY `uq_payments_razorpay_payment` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_2` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_3` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_4` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_5` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_6` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_7` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_8` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_9` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_10` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_11` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_12` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_13` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_14` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_15` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_16` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_17` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_18` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_19` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_20` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_21` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_22` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_23` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_24` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_25` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_26` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_27` (`razorpay_payment_id`),
  ADD KEY `idx_payments_razorpay_order` (`razorpay_order_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `payment_attempts`
--
ALTER TABLE `payment_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pa_order_id` (`order_id`,`attempt_number`),
  ADD KEY `idx_pa_razorpay_payment` (`razorpay_payment_id`),
  ADD KEY `idx_pa_status` (`status`),
  ADD KEY `payment_id` (`payment_id`);

--
-- Indexes for table `payout_logs`
--
ALTER TABLE `payout_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `wallet_id` (`wallet_id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `plan_features`
--
ALTER TABLE `plan_features`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_features_plan_id_feature_id` (`plan_id`,`feature_id`),
  ADD KEY `feature_id` (`feature_id`);

--
-- Indexes for table `platform_plans`
--
ALTER TABLE `platform_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `slug_2` (`slug`),
  ADD UNIQUE KEY `slug_3` (`slug`),
  ADD UNIQUE KEY `slug_4` (`slug`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `subcategory_id` (`subcategory_id`);

--
-- Indexes for table `ratings_reviews`
--
ALTER TABLE `ratings_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`),
  ADD KEY `reviewer_user_id` (`reviewer_user_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `delivery_person_id` (`delivery_person_id`);

--
-- Indexes for table `referrals`
--
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `referrer_id` (`referrer_id`),
  ADD KEY `referee_id` (`referee_id`),
  ADD KEY `referred_shop_id` (`referred_shop_id`);

--
-- Indexes for table `referral_rewards`
--
ALTER TABLE `referral_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `referral_id` (`referral_id`),
  ADD KEY `user_id_rewarded` (`user_id_rewarded`);

--
-- Indexes for table `referral_settings`
--
ALTER TABLE `referral_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD UNIQUE KEY `token_hash_2` (`token_hash`),
  ADD UNIQUE KEY `token_hash_3` (`token_hash`),
  ADD UNIQUE KEY `token_hash_4` (`token_hash`),
  ADD UNIQUE KEY `token_hash_5` (`token_hash`),
  ADD UNIQUE KEY `token_hash_6` (`token_hash`),
  ADD UNIQUE KEY `token_hash_7` (`token_hash`),
  ADD UNIQUE KEY `token_hash_8` (`token_hash`),
  ADD UNIQUE KEY `token_hash_9` (`token_hash`),
  ADD UNIQUE KEY `token_hash_10` (`token_hash`),
  ADD UNIQUE KEY `token_hash_11` (`token_hash`),
  ADD UNIQUE KEY `token_hash_12` (`token_hash`),
  ADD UNIQUE KEY `token_hash_13` (`token_hash`),
  ADD UNIQUE KEY `token_hash_14` (`token_hash`),
  ADD UNIQUE KEY `token_hash_15` (`token_hash`),
  ADD UNIQUE KEY `token_hash_16` (`token_hash`),
  ADD UNIQUE KEY `token_hash_17` (`token_hash`),
  ADD UNIQUE KEY `token_hash_18` (`token_hash`),
  ADD UNIQUE KEY `token_hash_19` (`token_hash`),
  ADD UNIQUE KEY `token_hash_20` (`token_hash`),
  ADD UNIQUE KEY `token_hash_21` (`token_hash`),
  ADD UNIQUE KEY `token_hash_22` (`token_hash`),
  ADD UNIQUE KEY `token_hash_23` (`token_hash`),
  ADD UNIQUE KEY `token_hash_24` (`token_hash`),
  ADD UNIQUE KEY `token_hash_25` (`token_hash`),
  ADD UNIQUE KEY `token_hash_26` (`token_hash`),
  ADD UNIQUE KEY `token_hash_27` (`token_hash`),
  ADD UNIQUE KEY `token_hash_28` (`token_hash`),
  ADD UNIQUE KEY `token_hash_29` (`token_hash`),
  ADD UNIQUE KEY `token_hash_30` (`token_hash`),
  ADD KEY `refresh_tokens_user_id` (`user_id`),
  ADD KEY `refresh_tokens_token_hash` (`token_hash`),
  ADD KEY `refresh_tokens_expires_at` (`expires_at`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `initiated_by` (`initiated_by`);

--
-- Indexes for table `schedule_templates`
--
ALTER TABLE `schedule_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shops`
--
ALTER TABLE `shops`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD UNIQUE KEY `uuid_4` (`uuid`),
  ADD UNIQUE KEY `uuid_5` (`uuid`),
  ADD UNIQUE KEY `uuid_6` (`uuid`),
  ADD UNIQUE KEY `uuid_7` (`uuid`),
  ADD UNIQUE KEY `uuid_8` (`uuid`),
  ADD UNIQUE KEY `uuid_9` (`uuid`),
  ADD UNIQUE KEY `uuid_10` (`uuid`),
  ADD UNIQUE KEY `uuid_11` (`uuid`),
  ADD UNIQUE KEY `uuid_12` (`uuid`),
  ADD UNIQUE KEY `uuid_13` (`uuid`),
  ADD UNIQUE KEY `uuid_14` (`uuid`),
  ADD UNIQUE KEY `uuid_15` (`uuid`),
  ADD UNIQUE KEY `uuid_16` (`uuid`),
  ADD UNIQUE KEY `uuid_17` (`uuid`),
  ADD UNIQUE KEY `uuid_18` (`uuid`),
  ADD UNIQUE KEY `uuid_19` (`uuid`),
  ADD UNIQUE KEY `uuid_20` (`uuid`),
  ADD UNIQUE KEY `uuid_21` (`uuid`),
  ADD UNIQUE KEY `uuid_22` (`uuid`),
  ADD UNIQUE KEY `uuid_23` (`uuid`),
  ADD UNIQUE KEY `uuid_24` (`uuid`),
  ADD UNIQUE KEY `uuid_25` (`uuid`),
  ADD UNIQUE KEY `uuid_26` (`uuid`),
  ADD UNIQUE KEY `uuid_27` (`uuid`),
  ADD UNIQUE KEY `uuid_28` (`uuid`),
  ADD UNIQUE KEY `uuid_29` (`uuid`),
  ADD UNIQUE KEY `uuid_30` (`uuid`),
  ADD UNIQUE KEY `uuid_31` (`uuid`),
  ADD UNIQUE KEY `uuid_32` (`uuid`),
  ADD UNIQUE KEY `slug_2` (`slug`),
  ADD UNIQUE KEY `uuid_33` (`uuid`),
  ADD UNIQUE KEY `slug_3` (`slug`),
  ADD UNIQUE KEY `uuid_34` (`uuid`),
  ADD UNIQUE KEY `slug_4` (`slug`),
  ADD KEY `owner_user_id` (`owner_user_id`),
  ADD KEY `referred_by_user_id` (`referred_by_user_id`);

--
-- Indexes for table `shop_onboarding_progress`
--
ALTER TABLE `shop_onboarding_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `owner_user_id` (`owner_user_id`),
  ADD KEY `step_id` (`step_id`);

--
-- Indexes for table `shop_onboarding_steps`
--
ALTER TABLE `shop_onboarding_steps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `step_key` (`step_key`),
  ADD UNIQUE KEY `step_key_2` (`step_key`),
  ADD UNIQUE KEY `step_key_3` (`step_key`),
  ADD UNIQUE KEY `step_key_4` (`step_key`),
  ADD UNIQUE KEY `step_key_5` (`step_key`),
  ADD UNIQUE KEY `step_key_6` (`step_key`),
  ADD UNIQUE KEY `step_key_7` (`step_key`),
  ADD UNIQUE KEY `step_key_8` (`step_key`),
  ADD UNIQUE KEY `step_key_9` (`step_key`),
  ADD UNIQUE KEY `step_key_10` (`step_key`),
  ADD UNIQUE KEY `step_key_11` (`step_key`),
  ADD UNIQUE KEY `step_key_12` (`step_key`),
  ADD UNIQUE KEY `step_key_13` (`step_key`),
  ADD UNIQUE KEY `step_key_14` (`step_key`),
  ADD UNIQUE KEY `step_key_15` (`step_key`),
  ADD UNIQUE KEY `step_key_16` (`step_key`),
  ADD UNIQUE KEY `step_key_17` (`step_key`),
  ADD UNIQUE KEY `step_key_18` (`step_key`),
  ADD UNIQUE KEY `step_key_19` (`step_key`),
  ADD UNIQUE KEY `step_key_20` (`step_key`),
  ADD UNIQUE KEY `step_key_21` (`step_key`),
  ADD UNIQUE KEY `step_key_22` (`step_key`),
  ADD UNIQUE KEY `step_key_23` (`step_key`),
  ADD UNIQUE KEY `step_key_24` (`step_key`),
  ADD UNIQUE KEY `step_key_25` (`step_key`),
  ADD UNIQUE KEY `step_key_26` (`step_key`),
  ADD UNIQUE KEY `step_key_27` (`step_key`),
  ADD UNIQUE KEY `step_key_28` (`step_key`),
  ADD UNIQUE KEY `step_key_29` (`step_key`),
  ADD UNIQUE KEY `step_key_30` (`step_key`);

--
-- Indexes for table `shop_schedule_exceptions`
--
ALTER TABLE `shop_schedule_exceptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shop_schedule_exceptions_shop_id_date` (`shop_id`,`date`);

--
-- Indexes for table `shop_schedule_master`
--
ALTER TABLE `shop_schedule_master`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shop_schedule_master_shop_id_day_of_week` (`shop_id`,`day_of_week`);

--
-- Indexes for table `shop_schedule_slots`
--
ALTER TABLE `shop_schedule_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `shop_settings`
--
ALTER TABLE `shop_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shop_id` (`shop_id`);

--
-- Indexes for table `shop_staff`
--
ALTER TABLE `shop_staff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `shop_wallets`
--
ALTER TABLE `shop_wallets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `shop_id` (`shop_id`);

--
-- Indexes for table `staff_roles`
--
ALTER TABLE `staff_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`),
  ADD UNIQUE KEY `role_name_2` (`role_name`),
  ADD UNIQUE KEY `role_name_3` (`role_name`),
  ADD UNIQUE KEY `role_name_4` (`role_name`),
  ADD UNIQUE KEY `role_name_5` (`role_name`),
  ADD UNIQUE KEY `role_name_6` (`role_name`),
  ADD UNIQUE KEY `role_name_7` (`role_name`),
  ADD UNIQUE KEY `role_name_8` (`role_name`),
  ADD UNIQUE KEY `role_name_9` (`role_name`),
  ADD UNIQUE KEY `role_name_10` (`role_name`),
  ADD UNIQUE KEY `role_name_11` (`role_name`),
  ADD UNIQUE KEY `role_name_12` (`role_name`),
  ADD UNIQUE KEY `role_name_13` (`role_name`),
  ADD UNIQUE KEY `role_name_14` (`role_name`),
  ADD UNIQUE KEY `role_name_15` (`role_name`),
  ADD UNIQUE KEY `role_name_16` (`role_name`),
  ADD UNIQUE KEY `role_name_17` (`role_name`),
  ADD UNIQUE KEY `role_name_18` (`role_name`),
  ADD UNIQUE KEY `role_name_19` (`role_name`),
  ADD UNIQUE KEY `role_name_20` (`role_name`),
  ADD UNIQUE KEY `role_name_21` (`role_name`);

--
-- Indexes for table `subcategories`
--
ALTER TABLE `subcategories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `subscription_pauses`
--
ALTER TABLE `subscription_pauses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `subscription_id` (`subscription_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD UNIQUE KEY `setting_key_2` (`setting_key`),
  ADD UNIQUE KEY `setting_key_3` (`setting_key`),
  ADD UNIQUE KEY `setting_key_4` (`setting_key`),
  ADD UNIQUE KEY `setting_key_5` (`setting_key`),
  ADD UNIQUE KEY `setting_key_6` (`setting_key`),
  ADD UNIQUE KEY `setting_key_7` (`setting_key`),
  ADD UNIQUE KEY `setting_key_8` (`setting_key`),
  ADD UNIQUE KEY `setting_key_9` (`setting_key`),
  ADD UNIQUE KEY `setting_key_10` (`setting_key`),
  ADD UNIQUE KEY `setting_key_11` (`setting_key`),
  ADD UNIQUE KEY `setting_key_12` (`setting_key`),
  ADD UNIQUE KEY `setting_key_13` (`setting_key`),
  ADD UNIQUE KEY `setting_key_14` (`setting_key`),
  ADD UNIQUE KEY `setting_key_15` (`setting_key`),
  ADD UNIQUE KEY `setting_key_16` (`setting_key`),
  ADD UNIQUE KEY `setting_key_17` (`setting_key`),
  ADD UNIQUE KEY `setting_key_18` (`setting_key`),
  ADD UNIQUE KEY `setting_key_19` (`setting_key`),
  ADD UNIQUE KEY `setting_key_20` (`setting_key`),
  ADD UNIQUE KEY `setting_key_21` (`setting_key`);

--
-- Indexes for table `tokens`
--
ALTER TABLE `tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tokens_token` (`token`(255)),
  ADD KEY `idx_tokens_expires` (`expires_at`),
  ADD KEY `idx_tokens_active` (`is_active`),
  ADD KEY `idx_tokens_type` (`type`),
  ADD KEY `idx_tokens_created_by` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uuid` (`uuid`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `phone_2` (`phone`),
  ADD UNIQUE KEY `phone_3` (`phone`),
  ADD UNIQUE KEY `phone_4` (`phone`),
  ADD UNIQUE KEY `phone_5` (`phone`),
  ADD UNIQUE KEY `phone_6` (`phone`),
  ADD UNIQUE KEY `phone_7` (`phone`),
  ADD UNIQUE KEY `phone_8` (`phone`),
  ADD UNIQUE KEY `phone_9` (`phone`),
  ADD UNIQUE KEY `phone_10` (`phone`),
  ADD UNIQUE KEY `phone_11` (`phone`),
  ADD UNIQUE KEY `phone_12` (`phone`),
  ADD UNIQUE KEY `phone_13` (`phone`),
  ADD UNIQUE KEY `phone_14` (`phone`),
  ADD UNIQUE KEY `phone_15` (`phone`),
  ADD UNIQUE KEY `uuid_2` (`uuid`),
  ADD UNIQUE KEY `phone_16` (`phone`),
  ADD UNIQUE KEY `uuid_3` (`uuid`),
  ADD UNIQUE KEY `phone_17` (`phone`),
  ADD UNIQUE KEY `uuid_4` (`uuid`),
  ADD UNIQUE KEY `phone_18` (`phone`),
  ADD UNIQUE KEY `uuid_5` (`uuid`),
  ADD UNIQUE KEY `phone_19` (`phone`),
  ADD UNIQUE KEY `uuid_6` (`uuid`),
  ADD UNIQUE KEY `phone_20` (`phone`),
  ADD UNIQUE KEY `uuid_7` (`uuid`),
  ADD UNIQUE KEY `phone_21` (`phone`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `referral_code` (`referral_code`),
  ADD UNIQUE KEY `referral_code_2` (`referral_code`),
  ADD UNIQUE KEY `referral_code_3` (`referral_code`),
  ADD UNIQUE KEY `referral_code_4` (`referral_code`),
  ADD UNIQUE KEY `referral_code_5` (`referral_code`),
  ADD UNIQUE KEY `referral_code_6` (`referral_code`),
  ADD UNIQUE KEY `referral_code_7` (`referral_code`),
  ADD UNIQUE KEY `referral_code_8` (`referral_code`),
  ADD UNIQUE KEY `referral_code_9` (`referral_code`),
  ADD UNIQUE KEY `referral_code_10` (`referral_code`),
  ADD UNIQUE KEY `referral_code_11` (`referral_code`),
  ADD UNIQUE KEY `referral_code_12` (`referral_code`),
  ADD UNIQUE KEY `referral_code_13` (`referral_code`),
  ADD UNIQUE KEY `referral_code_14` (`referral_code`),
  ADD UNIQUE KEY `referral_code_15` (`referral_code`),
  ADD UNIQUE KEY `referral_code_16` (`referral_code`),
  ADD UNIQUE KEY `referral_code_17` (`referral_code`),
  ADD UNIQUE KEY `referral_code_18` (`referral_code`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `referral_code_19` (`referral_code`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `referral_code_20` (`referral_code`),
  ADD KEY `default_address_id` (`default_address_id`),
  ADD KEY `current_level_id` (`current_level_id`),
  ADD KEY `referred_by_id` (`referred_by_id`);

--
-- Indexes for table `user_devices`
--
ALTER TABLE `user_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_device_unique` (`user_id`,`device_id`),
  ADD UNIQUE KEY `user_devices_user_id_device_id` (`user_id`,`device_id`);

--
-- Indexes for table `user_onboarding_progress`
--
ALTER TABLE `user_onboarding_progress`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `step_id` (`step_id`);

--
-- Indexes for table `user_onboarding_steps`
--
ALTER TABLE `user_onboarding_steps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `step_key` (`step_key`),
  ADD UNIQUE KEY `step_key_2` (`step_key`),
  ADD UNIQUE KEY `step_key_3` (`step_key`),
  ADD UNIQUE KEY `step_key_4` (`step_key`),
  ADD UNIQUE KEY `step_key_5` (`step_key`),
  ADD UNIQUE KEY `step_key_6` (`step_key`),
  ADD UNIQUE KEY `step_key_7` (`step_key`),
  ADD UNIQUE KEY `step_key_8` (`step_key`),
  ADD UNIQUE KEY `step_key_9` (`step_key`),
  ADD UNIQUE KEY `step_key_10` (`step_key`),
  ADD UNIQUE KEY `step_key_11` (`step_key`),
  ADD UNIQUE KEY `step_key_12` (`step_key`),
  ADD UNIQUE KEY `step_key_13` (`step_key`),
  ADD UNIQUE KEY `step_key_14` (`step_key`),
  ADD UNIQUE KEY `step_key_15` (`step_key`),
  ADD UNIQUE KEY `step_key_16` (`step_key`),
  ADD UNIQUE KEY `step_key_17` (`step_key`),
  ADD UNIQUE KEY `step_key_18` (`step_key`),
  ADD UNIQUE KEY `step_key_19` (`step_key`),
  ADD UNIQUE KEY `step_key_20` (`step_key`),
  ADD UNIQUE KEY `step_key_21` (`step_key`),
  ADD UNIQUE KEY `step_key_22` (`step_key`),
  ADD UNIQUE KEY `step_key_23` (`step_key`),
  ADD UNIQUE KEY `step_key_24` (`step_key`),
  ADD UNIQUE KEY `step_key_25` (`step_key`),
  ADD UNIQUE KEY `step_key_26` (`step_key`),
  ADD UNIQUE KEY `step_key_27` (`step_key`),
  ADD UNIQUE KEY `step_key_28` (`step_key`),
  ADD UNIQUE KEY `step_key_29` (`step_key`),
  ADD UNIQUE KEY `step_key_30` (`step_key`);

--
-- Indexes for table `user_platform_subscriptions`
--
ALTER TABLE `user_platform_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `plan_id` (`plan_id`);

--
-- Indexes for table `user_shop_stats`
--
ALTER TABLE `user_shop_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_shop_stats_user_id_shop_id` (`user_id`,`shop_id`),
  ADD KEY `shop_id` (`shop_id`);

--
-- Indexes for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `shop_id` (`shop_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `address_id` (`address_id`);

--
-- Indexes for table `webhook_events`
--
ALTER TABLE `webhook_events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_id` (`event_id`),
  ADD UNIQUE KEY `event_id_2` (`event_id`),
  ADD UNIQUE KEY `event_id_3` (`event_id`),
  ADD UNIQUE KEY `event_id_4` (`event_id`),
  ADD UNIQUE KEY `event_id_5` (`event_id`),
  ADD UNIQUE KEY `event_id_6` (`event_id`),
  ADD UNIQUE KEY `event_id_7` (`event_id`),
  ADD UNIQUE KEY `event_id_8` (`event_id`),
  ADD UNIQUE KEY `event_id_9` (`event_id`),
  ADD UNIQUE KEY `event_id_10` (`event_id`),
  ADD UNIQUE KEY `event_id_11` (`event_id`),
  ADD UNIQUE KEY `event_id_12` (`event_id`),
  ADD UNIQUE KEY `event_id_13` (`event_id`),
  ADD UNIQUE KEY `event_id_14` (`event_id`),
  ADD UNIQUE KEY `event_id_15` (`event_id`),
  ADD UNIQUE KEY `event_id_16` (`event_id`),
  ADD UNIQUE KEY `event_id_17` (`event_id`),
  ADD UNIQUE KEY `event_id_18` (`event_id`),
  ADD UNIQUE KEY `event_id_19` (`event_id`),
  ADD UNIQUE KEY `event_id_20` (`event_id`),
  ADD UNIQUE KEY `event_id_21` (`event_id`),
  ADD UNIQUE KEY `event_id_22` (`event_id`),
  ADD UNIQUE KEY `event_id_23` (`event_id`),
  ADD UNIQUE KEY `event_id_24` (`event_id`),
  ADD UNIQUE KEY `event_id_25` (`event_id`),
  ADD UNIQUE KEY `event_id_26` (`event_id`),
  ADD UNIQUE KEY `event_id_27` (`event_id`),
  ADD KEY `idx_we_razorpay_payment` (`razorpay_payment_id`),
  ADD KEY `idx_we_processed` (`is_processed`,`created_at`),
  ADD KEY `idx_we_event_type` (`event_type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_assignments`
--
ALTER TABLE `delivery_assignments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_persons`
--
ALTER TABLE `delivery_persons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `features_master`
--
ALTER TABLE `features_master`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feature_overrides`
--
ALTER TABLE `feature_overrides`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `generated_slots`
--
ALTER TABLE `generated_slots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loyalty_levels`
--
ALTER TABLE `loyalty_levels`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `loyalty_settings`
--
ALTER TABLE `loyalty_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `otp_logs`
--
ALTER TABLE `otp_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=122;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_attempts`
--
ALTER TABLE `payment_attempts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payout_logs`
--
ALTER TABLE `payout_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `plan_features`
--
ALTER TABLE `plan_features`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `platform_plans`
--
ALTER TABLE `platform_plans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `ratings_reviews`
--
ALTER TABLE `ratings_reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `referrals`
--
ALTER TABLE `referrals`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `referral_rewards`
--
ALTER TABLE `referral_rewards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `referral_settings`
--
ALTER TABLE `referral_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT for table `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedule_templates`
--
ALTER TABLE `schedule_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shops`
--
ALTER TABLE `shops`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `shop_onboarding_progress`
--
ALTER TABLE `shop_onboarding_progress`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `shop_onboarding_steps`
--
ALTER TABLE `shop_onboarding_steps`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `shop_schedule_exceptions`
--
ALTER TABLE `shop_schedule_exceptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shop_schedule_master`
--
ALTER TABLE `shop_schedule_master`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shop_schedule_slots`
--
ALTER TABLE `shop_schedule_slots`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shop_settings`
--
ALTER TABLE `shop_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `shop_staff`
--
ALTER TABLE `shop_staff`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shop_wallets`
--
ALTER TABLE `shop_wallets`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `staff_roles`
--
ALTER TABLE `staff_roles`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subcategories`
--
ALTER TABLE `subcategories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `subscription_pauses`
--
ALTER TABLE `subscription_pauses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tokens`
--
ALTER TABLE `tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_devices`
--
ALTER TABLE `user_devices`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `user_onboarding_progress`
--
ALTER TABLE `user_onboarding_progress`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `user_onboarding_steps`
--
ALTER TABLE `user_onboarding_steps`
  MODIFY `id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_platform_subscriptions`
--
ALTER TABLE `user_platform_subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_shop_stats`
--
ALTER TABLE `user_shop_stats`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `webhook_events`
--
ALTER TABLE `webhook_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `addresses`
--
ALTER TABLE `addresses`
  ADD CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_83` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `complaints_ibfk_84` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `complaints_ibfk_85` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `complaints_ibfk_86` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `complaints_ibfk_87` FOREIGN KEY (`admin_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `coupons`
--
ALTER TABLE `coupons`
  ADD CONSTRAINT `coupons_ibfk_49` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `coupons_ibfk_50` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `coupon_usage`
--
ALTER TABLE `coupon_usage`
  ADD CONSTRAINT `coupon_usage_ibfk_61` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `coupon_usage_ibfk_62` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `coupon_usage_ibfk_63` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `delivery_assignments`
--
ALTER TABLE `delivery_assignments`
  ADD CONSTRAINT `delivery_assignments_ibfk_61` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `delivery_assignments_ibfk_62` FOREIGN KEY (`delivery_person_id`) REFERENCES `delivery_persons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `delivery_assignments_ibfk_63` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `delivery_persons`
--
ALTER TABLE `delivery_persons`
  ADD CONSTRAINT `delivery_persons_ibfk_35` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `delivery_persons_ibfk_36` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `feature_overrides`
--
ALTER TABLE `feature_overrides`
  ADD CONSTRAINT `feature_overrides_ibfk_7` FOREIGN KEY (`feature_id`) REFERENCES `features_master` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `feature_overrides_ibfk_8` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `feature_overrides_ibfk_9` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `generated_slots`
--
ALTER TABLE `generated_slots`
  ADD CONSTRAINT `generated_slots_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_41` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_42` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory_logs`
--
ALTER TABLE `inventory_logs`
  ADD CONSTRAINT `inventory_logs_ibfk_61` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_logs_ibfk_62` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_logs_ibfk_63` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `loyalty_points`
--
ALTER TABLE `loyalty_points`
  ADD CONSTRAINT `loyalty_points_ibfk_53` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `loyalty_points_ibfk_54` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_159` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_160` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_161` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_162` FOREIGN KEY (`delivery_person_id`) REFERENCES `delivery_persons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_163` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_164` FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `orders_ibfk_165` FOREIGN KEY (`slot_id`) REFERENCES `generated_slots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_51` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_52` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_status_logs`
--
ALTER TABLE `order_status_logs`
  ADD CONSTRAINT `order_status_logs_ibfk_51` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_status_logs_ibfk_52` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_101` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_102` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_103` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_104` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payment_attempts`
--
ALTER TABLE `payment_attempts`
  ADD CONSTRAINT `payment_attempts_ibfk_51` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payment_attempts_ibfk_52` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payout_logs`
--
ALTER TABLE `payout_logs`
  ADD CONSTRAINT `payout_logs_ibfk_7` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payout_logs_ibfk_8` FOREIGN KEY (`wallet_id`) REFERENCES `shop_wallets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `payout_logs_ibfk_9` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `plan_features`
--
ALTER TABLE `plan_features`
  ADD CONSTRAINT `plan_features_ibfk_5` FOREIGN KEY (`plan_id`) REFERENCES `platform_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `plan_features_ibfk_6` FOREIGN KEY (`feature_id`) REFERENCES `features_master` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_47` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_48` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ratings_reviews`
--
ALTER TABLE `ratings_reviews`
  ADD CONSTRAINT `ratings_reviews_ibfk_81` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ratings_reviews_ibfk_82` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ratings_reviews_ibfk_83` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ratings_reviews_ibfk_84` FOREIGN KEY (`delivery_person_id`) REFERENCES `delivery_persons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `referrals`
--
ALTER TABLE `referrals`
  ADD CONSTRAINT `referrals_ibfk_55` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `referrals_ibfk_56` FOREIGN KEY (`referee_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `referrals_ibfk_57` FOREIGN KEY (`referred_shop_id`) REFERENCES `shops` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `referral_rewards`
--
ALTER TABLE `referral_rewards`
  ADD CONSTRAINT `referral_rewards_ibfk_57` FOREIGN KEY (`referral_id`) REFERENCES `referrals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `referral_rewards_ibfk_58` FOREIGN KEY (`user_id_rewarded`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_101` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_102` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_103` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_104` FOREIGN KEY (`initiated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `shops`
--
ALTER TABLE `shops`
  ADD CONSTRAINT `shops_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `shops_ibfk_2` FOREIGN KEY (`referred_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `shop_onboarding_progress`
--
ALTER TABLE `shop_onboarding_progress`
  ADD CONSTRAINT `shop_onboarding_progress_ibfk_85` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `shop_onboarding_progress_ibfk_86` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `shop_onboarding_progress_ibfk_87` FOREIGN KEY (`step_id`) REFERENCES `shop_onboarding_steps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shop_schedule_exceptions`
--
ALTER TABLE `shop_schedule_exceptions`
  ADD CONSTRAINT `shop_schedule_exceptions_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shop_schedule_master`
--
ALTER TABLE `shop_schedule_master`
  ADD CONSTRAINT `shop_schedule_master_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shop_schedule_slots`
--
ALTER TABLE `shop_schedule_slots`
  ADD CONSTRAINT `shop_schedule_slots_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shop_settings`
--
ALTER TABLE `shop_settings`
  ADD CONSTRAINT `shop_settings_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shop_staff`
--
ALTER TABLE `shop_staff`
  ADD CONSTRAINT `shop_staff_ibfk_58` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `shop_staff_ibfk_59` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `shop_staff_ibfk_60` FOREIGN KEY (`role_id`) REFERENCES `staff_roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `shop_wallets`
--
ALTER TABLE `shop_wallets`
  ADD CONSTRAINT `shop_wallets_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subcategories`
--
ALTER TABLE `subcategories`
  ADD CONSTRAINT `subcategories_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `subscription_pauses`
--
ALTER TABLE `subscription_pauses`
  ADD CONSTRAINT `subscription_pauses_ibfk_39` FOREIGN KEY (`subscription_id`) REFERENCES `user_subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `subscription_pauses_ibfk_40` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_88` FOREIGN KEY (`default_address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_89` FOREIGN KEY (`current_level_id`) REFERENCES `loyalty_levels` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_90` FOREIGN KEY (`referred_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_devices`
--
ALTER TABLE `user_devices`
  ADD CONSTRAINT `user_devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_onboarding_progress`
--
ALTER TABLE `user_onboarding_progress`
  ADD CONSTRAINT `user_onboarding_progress_ibfk_57` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_onboarding_progress_ibfk_58` FOREIGN KEY (`step_id`) REFERENCES `user_onboarding_steps` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_platform_subscriptions`
--
ALTER TABLE `user_platform_subscriptions`
  ADD CONSTRAINT `user_platform_subscriptions_ibfk_5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_platform_subscriptions_ibfk_6` FOREIGN KEY (`plan_id`) REFERENCES `platform_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_shop_stats`
--
ALTER TABLE `user_shop_stats`
  ADD CONSTRAINT `user_shop_stats_ibfk_41` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_shop_stats_ibfk_42` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD CONSTRAINT `user_subscriptions_ibfk_77` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_subscriptions_ibfk_78` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_subscriptions_ibfk_79` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_subscriptions_ibfk_80` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
