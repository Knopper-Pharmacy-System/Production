-- Backfill BRANCH_INVENTORY for branch 1 (BMC MAIN)
-- This repairs rows that already exist with null stock fields and creates any missing product rows.

START TRANSACTION;

UPDATE BRANCH_INVENTORY bi
JOIN PRODUCTS p ON p.product_id = bi.product_id
LEFT JOIN (
    SELECT branch_id, MIN(gondola_id) AS gondola_id
    FROM GONDOLAS
    GROUP BY branch_id
) g ON g.branch_id = bi.branch_id
SET
    bi.gondola_id = COALESCE(bi.gondola_id, g.gondola_id),
    bi.reorder_level = COALESCE(bi.reorder_level, 10),
    bi.target_stock_level = COALESCE(bi.target_stock_level, 100),
    bi.batch_number = COALESCE(
        NULLIF(TRIM(bi.batch_number), ''),
        CONCAT('BATCH-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-', LPAD(p.product_id, 4, '0'))
    ),
    bi.expiry_date = COALESCE(bi.expiry_date, DATE_ADD(CURDATE(), INTERVAL 12 MONTH)),
    bi.quantity_on_hand = COALESCE(bi.quantity_on_hand, 100)
WHERE bi.branch_id = 1;

INSERT INTO BRANCH_INVENTORY (
    inventory_id,
    branch_id,
    product_id,
    gondola_id,
    reorder_level,
    target_stock_level,
    batch_number,
    expiry_date,
    quantity_on_hand
)
SELECT
    900000 + p.product_id AS inventory_id,
    1 AS branch_id,
    p.product_id,
    g.gondola_id,
    10 AS reorder_level,
    100 AS target_stock_level,
    CONCAT('BATCH-', DATE_FORMAT(CURDATE(), '%Y%m%d'), '-', LPAD(p.product_id, 4, '0')) AS batch_number,
    DATE_ADD(CURDATE(), INTERVAL 12 MONTH) AS expiry_date,
    100 AS quantity_on_hand
FROM PRODUCTS p
LEFT JOIN (
    SELECT branch_id, MIN(gondola_id) AS gondola_id
    FROM GONDOLAS
    GROUP BY branch_id
) g ON g.branch_id = 1
WHERE NOT EXISTS (
    SELECT 1
    FROM BRANCH_INVENTORY bi
    WHERE bi.branch_id = 1
      AND bi.product_id = p.product_id
)
ORDER BY p.product_id;

COMMIT;

-- Verify the branch inventory was populated.
SELECT COUNT(*) AS inventory_rows FROM BRANCH_INVENTORY WHERE branch_id = 1;
SELECT COUNT(*) AS rows_with_stock FROM BRANCH_INVENTORY WHERE branch_id = 1 AND quantity_on_hand > 0;
SELECT inventory_id, branch_id, product_id, gondola_id, reorder_level, target_stock_level, batch_number, expiry_date, quantity_on_hand
FROM BRANCH_INVENTORY
WHERE branch_id = 1
ORDER BY inventory_id
LIMIT 5;
