;; marketplace-core-helper.clar
;; Helper functions for marketplace-core.clar

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-NO-SUCH-LISTING (err u5))

(define-event event-listing-status-updated (listing-id uint new-status (string-ascii 20)))

(define-public (update-listing-status (listing-id uint) (new-status (string-ascii 20)))
  (let ((listing (unwrap! (map-get? listings listing-id) (err u1))))
    (map-set listings listing-id {listing | status: new-status})
    (emit-event event-listing-status-updated listing-id new-status)
    (ok true)
  )
)

;; Update listing status (helper function for other contracts)
(define-public (update-listing-status
    (listing-id uint)
    (active bool))
    (let
        ((listing (unwrap! (contract-call? .marketplace-core get-listing listing-id) ERR-NO-SUCH-LISTING))
         (contract-caller (unwrap-panic (get-contract-caller))))
        
        ;; Only authorized contracts can update status
        (asserts! (or 
            (is-eq contract-caller .marketplace-escrow)
            (is-eq contract-caller .marketplace-disputes)
        ) ERR-NOT-AUTHORIZED)
        
        ;; Update listing in core contract
        ;; This would need proper implementation in the core contract
        ;; For now, we'll mock the update
        (print { action: "update-listing", listing-id: listing-id, active: active })
        
        (ok true)
    )
)

;; Get current block height (helper function)
(define-read-only (get-current-block-height)
    (unwrap-panic (get-block-info? height u0))
)
