;; marketplace-escrow-helper.clar
;; Helper functions for marketplace-escrow.clar

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-NO-SUCH-LISTING (err u5))

;; Update escrow tx-id (helper function for BTC verification)
(define-public (update-escrow-tx-id
    (listing-id uint)
    (tx-id (buff 32)))
    (let
        ((escrow (unwrap! (contract-call? .marketplace-escrow get-escrow listing-id) ERR-NO-SUCH-LISTING))
         (contract-caller (unwrap-panic (get-contract-caller))))
        
        ;; Only authorized contracts can update escrow
        (asserts! (is-eq contract-caller .marketplace-btc-verification) ERR-NOT-AUTHORIZED)
        
        ;; Update escrow in escrow contract
        ;; This would need proper implementation in the escrow contract
        ;; For now, we'll mock the update
        (print { action: "update-escrow-tx-id", listing-id: listing-id, tx-id: tx-id })
        
        (ok true)
    )
)

;; Update escrow status (helper function for dispute resolution)
(define-public (update-escrow-status
    (listing-id uint)
    (status (string-ascii 20)))
    (let
        ((escrow (unwrap! (contract-call? .marketplace-escrow get-escrow listing-id) ERR-NO-SUCH-LISTING))
         (contract-caller (unwrap-panic (get-contract-caller))))
        
        ;; Only authorized contracts can update escrow
        (asserts! (is-eq contract-caller .marketplace-disputes) ERR-NOT-AUTHORIZED)
        
        ;; Update escrow in escrow contract
        ;; This would need proper implementation in the escrow contract
        ;; For now, we'll mock the update
        (print { action: "update-escrow-status", listing-id: listing-id, status: status })
        
        (ok true)
    )
)
