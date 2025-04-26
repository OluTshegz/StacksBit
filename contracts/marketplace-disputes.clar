;; marketplace-disputes.clar
;; Handles dispute resolution for the Bitcoin P2P Marketplace

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-NO-SUCH-DISPUTE (err u13))
(define-constant ERR-DISPUTE-CLOSED (err u14))

;; Dispute data structure
(define-map disputes uint {
    initiator: principal,
    reason: (string-ascii 100),
    status: (string-ascii 20),  ;; "open", "resolved-refund", "resolved-release"
    created-at: uint,
    resolved-at: (optional uint),
    resolution-notes: (optional (string-ascii 100))
})

;; Read-only function to get dispute details
(define-read-only (get-dispute (listing-id uint))
    (map-get? disputes listing-id)
)

;; Register a new dispute
(define-public (register-dispute
    (listing-id uint)
    (initiator principal)
    (reason (string-ascii 100)))
    (let
        ((block-height (unwrap-panic (get-block-info? height u0))))
        
        ;; Create dispute record
        (map-set disputes listing-id {
            initiator: initiator,
            reason: reason,
            status: "open",
            created-at: block-height,
            resolved-at: none,
            resolution-notes: none
        })
        
        (ok true)
    )
)

;; Resolve dispute with refund to buyer
(define-public (resolve-dispute-refund
    (listing-id uint)
    (notes (string-ascii 100)))
    (let
        ((dispute (unwrap! (map-get? disputes listing-id) ERR-NO-SUCH-DISPUTE))
         (platform-wallet (contract-call? .marketplace-core get-platform-wallet))
         (block-height (unwrap-panic (get-block-info? height u0))))
        
        ;; Only platform wallet (arbiter) can resolve disputes
        (asserts! (is-eq tx-sender platform-wallet) ERR-NOT-AUTHORIZED)
        
        ;; Check dispute is open
        (asserts! (is-eq (get status dispute) "open") ERR-DISPUTE-CLOSED)
        
        ;; Update dispute status
        (map-set disputes listing-id (merge dispute { 
            status: "resolved-refund", 
            resolved-at: (some block-height),
            resolution-notes: (some notes)
        }))
        
        ;; Process refund
        (try! (contract-call? .marketplace-escrow refund-escrow listing-id))
        
        (ok true)
    )
)

;; Resolve dispute with funds release to seller
(define-public (resolve-dispute-release
    (listing-id uint)
    (notes (string-ascii 100)))
    (let
        ((dispute (unwrap! (map-get? disputes listing-id) ERR-NO-SUCH-DISPUTE))
         (platform-wallet (contract-call? .marketplace-core get-platform-wallet))
         (escrow (unwrap! (contract-call? .marketplace-escrow get-escrow listing-id) ERR-NO-SUCH-DISPUTE))
         (block-height (unwrap-panic (get-block-info? height u0))))
        
        ;; Only platform wallet (arbiter) can resolve disputes
        (asserts! (is-eq tx-sender platform-wallet) ERR-NOT-AUTHORIZED)
        
        ;; Check dispute is open
        (asserts! (is-eq (get status dispute) "open") ERR-DISPUTE-CLOSED)
        
        ;; Update dispute status
        (map-set disputes listing-id (merge dispute { 
            status: "resolved-release", 
            resolved-at: (some block-height),
            resolution-notes: (some notes)
        }))
        
        ;; Release funds to seller
        (try! (as-contract (stx-transfer? (get stx-amount escrow) tx-sender (get seller escrow))))
        
        ;; Update escrow status
        (try! (contract-call? .marketplace-escrow-helper update-escrow-status listing-id "completed"))
        
        (ok true)
    )
)
