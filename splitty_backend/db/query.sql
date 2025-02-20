-- User Management Queries

-- name: CreateUser :one
INSERT INTO users (email, password_hash) 
VALUES ($1, $2) 
RETURNING user_id;

-- name: GetUserByEmail :one
SELECT user_id, password_hash 
FROM users 
WHERE email = $1;

-- Receipt Management Queries

-- name: CreateReceipt :one
INSERT INTO receipts (
    user_id, name_of_establishment, currency, 
    number_of_items, subtotal, tax_value, tax_na,
    tip_value, tip_na, additional_charges_value,
    additional_charges_na, total, image_data,
    image_content_type, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, 
    $10, $11, $12, $13, $14, $15
) 
RETURNING receipt_id;

-- name: AddReceiptItem :exec
INSERT INTO receipt_items (
    receipt_id, name, quantity, 
    price_per_item, total_price
) VALUES (
    $1, $2, $3, $4, $5
);

-- name: GetReceiptWithItems :one
WITH receipt_data AS (
    SELECT * FROM receipts 
    WHERE receipt_id = $1
)
SELECT 
    r.receipt_id,
    r.user_id,
    r.name_of_establishment,
    r.currency,
    r.number_of_items,
    r.subtotal,
    r.tax_value,
    r.tax_na,
    r.tip_value,
    r.tip_na,
    r.additional_charges_value,
    r.additional_charges_na,
    r.total,
    r.image_data,
    r.image_content_type,
    r.status,
    r.created_at,
    r.updated_at,
    COALESCE(json_agg(
        json_build_object(
            'name', ri.name,
            'quantity', ri.quantity,
            'price_per_item', ri.price_per_item,
            'total_price', ri.total_price
        )
    ) FILTER (WHERE ri.receipt_id IS NOT NULL), '[]') AS items
FROM receipts r
LEFT JOIN receipt_items ri ON r.receipt_id = ri.receipt_id
WHERE r.receipt_id = $1
GROUP BY r.receipt_id;

-- name: GetUserReceipts :many
SELECT receipt_id, name_of_establishment, total, created_at, status
FROM receipts 
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetReceiptImage :one
SELECT image_data, image_content_type 
FROM receipts 
WHERE receipt_id = $1;

-- name: UpdateReceiptStatus :exec
UPDATE receipts 
SET status = $2 
WHERE receipt_id = $1;

-- name: DeleteReceipt :exec
DELETE FROM receipts 
WHERE receipt_id = $1 AND user_id = $2;

-- name: SearchReceipts :many
SELECT receipt_id, name_of_establishment, total, created_at 
FROM receipts 
WHERE user_id = $1 
AND name_of_establishment ILIKE $2
ORDER BY created_at DESC;

-- name: GetReceiptStatistics :one
SELECT 
    COUNT(*) as total_receipts,
    SUM(total) as total_spent,
    AVG(total) as average_receipt_amount,
    MIN(total) as min_receipt_amount,
    MAX(total) as max_receipt_amount
FROM receipts 
WHERE user_id = $1;
