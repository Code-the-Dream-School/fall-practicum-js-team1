SELECT c.status, COUNT(c.status) FROM claims c
JOIN items i ON i.id = c.item_id
WHERE i.owner_id = $1 AND c.status IN ('pending', 'approved', 'picked_up')
GROUP BY c.status
