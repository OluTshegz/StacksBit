;; marketplace-escrow.clar
;; Handles escrow functionality for the Bitcoin P2P Marketplace

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-NO-SUCH-LISTING (err u5))
(define-constant ERR-ALREADY-CLAIMED (err u6))
(define-constant ERR-DISPUTE-EXISTS (err u7))
(define-constant ERR-BTC-TX-UNVERIFIED (err u8))

(define-event event-escrow-status-updated (listing-id uint new-status (string-ascii 20)))

(define-public (update-escrow-status (listing-id uint) (status (string-ascii 20)))
  (let ((escrow (unwrap! (map-get? escrows listing-id) (err u5))))
    (map-set escrows listing-id {escrow | status: status})
    (emit-event event-escrow-status-updated listing-id status)
    (ok true)
  )
)

;; Example: Adding a helper for checking escrow status
(define-public (get-escrow-status (listing-id uint))
  (let ((escrow (unwrap! (map-get? escrows listing-id) (err u5))))
    (ok (get status escrow)))
)

;; Escrow for active trades
(define-map escrows uint {
    buyer: principal,
    seller: principal,
    stx-amount: uint,
    btc-amount: uint,
    btc-receiver-address: (string-ascii 34),
    btc-tx-id: (optional (buff 32)),
    status: (string-ascii 20),  ;; "active", "completed", "disputed", "refunded"
    created-at: uint
})

;; Read-only function to get escrow details
(define-read-only (get-escrow (listing-id uint))
    (map-get? escrows listing-id)
)

;; Start a purchase (place STX in escrow)
(define-public (purchase-listing 
    (listing-id uint) 
    (btc-receiver-address (string-ascii 34)))
    (let
        ((listing (unwrap! (contract-call? .marketplace-core get-listing listing-id) ERR-NO-SUCH-LISTING))
         (block-height (unwrap-panic (get-block-info? height u0)))
         (stx-amount (get stx-required listing))
         (platform-fee (/ (* stx-amount (contract-call? .marketplace-core get-platform-fee)) u10000))
         (platform-wallet (contract-call? .marketplace-core get-platform-wallet)))
        
        ;; Check listing is active and not expired
        (asserts! (get active listing) (err u3)) ;; ERR-LISTING-CLOSED
        (asserts! (<= block-height (get expires-at listing)) (err u3)) ;; ERR-LISTING-CLOSED
        
        ;; Transfer STX to escrow (contract)
        (try! (stx-transfer? stx-amount tx-sender (as-contract tx-sender)))
        
        ;; Transfer platform fee to platform wallet
        (try! (as-contract (stx-transfer? platform-fee tx-sender platform-wallet)))
        
        ;; Create escrow record
        (map-set escrows listing-id {
            buyer: tx-sender,
            seller: (get seller listing),
            stx-amount: (- stx-amount platform-fee),
            btc-amount: (get btc-amount listing),
            btc-receiver-address: btc-receiver-address,
            btc-tx-id: none,
            status: "active",
            created-at: block-height
        })
        
        ;; Mark listing as inactive by calling the core contract
        (try! (contract-call? .marketplace-core-helper update-listing-status listing-id false))
        
        (ok true)
    )
)

;; Confirm transaction and release STX to seller
(define-public (confirm-receipt 
    (listing-id uint))
    (let
        ((escrow (unwrap! (map-get? escrows listing-id) ERR-NO-SUCH-LISTING)))
        
        ;; Only buyer can confirm receipt
        (asserts! (is-eq tx-sender (get buyer escrow)) ERR-NOT-AUTHORIZED)
        
        ;; Check if BTC transaction is verified
        (match (get btc-tx-id escrow)
            tx-id (asserts! (contract-call? .marketplace-btc-verification is-tx-verified tx-id) 
                           ERR-BTC-TX-UNVERIFIED)
            ERR-BTC-TX-UNVERIFIED
        )
        
        ;; Release STX to seller
        (try! (as-contract (stx-transfer? (get stx-amount escrow) tx-sender (get seller escrow))))
        
        ;; Update escrow status
        (map-set escrows listing-id (merge escrow { status: "completed" }))
        
        (ok true)
    )
)

;; Open a dispute
(define-public (open-dispute
    (listing-id uint)
    (reason (string-ascii 100)))
    (let
        ((escrow (unwrap! (map-get? escrows listing-id) ERR-NO-SUCH-LISTING)))
        
        ;; Only buyer or seller can open dispute
        (asserts! (or (is-eq tx-sender (get buyer escrow)) 
                      (is-eq tx-sender (get seller escrow))) 
                ERR-NOT-AUTHORIZED)
        
        ;; Check escrow is active
        (asserts! (is-eq (get status escrow) "active") ERR-DISPUTE-EXISTS)
        
        ;; Update escrow status
        (map-set escrows listing-id (merge escrow { status: "disputed" }))
        
        ;; Register dispute details in disputes contract
        (try! (contract-call? .marketplace-disputes register-dispute listing-id tx-sender reason))
        
        (ok true)
    )
)

;; Refund STX to buyer (for dispute resolution)
(define-public (refund-escrow
    (listing-id uint))
    (let
        ((escrow (unwrap! (map-get? escrows listing-id) ERR-NO-SUCH-LISTING))
         (platform-wallet (contract-call? .marketplace-core get-platform-wallet)))
        
        ;; Only platform wallet (arbiter) can initiate refund
        (asserts! (is-eq tx-sender platform-wallet) ERR-NOT-AUTHORIZED)
        
        ;; Check escrow is disputed
        (asserts! (is-eq (get status escrow) "disputed") ERR-NOT-AUTHORIZED)
        
        ;; Release STX to buyer
        (try! (as-contract (stx-transfer? (get stx-amount escrow) tx-sender (get buyer escrow))))
        
        ;; Update escrow status
        (map-set escrows listing-id (merge escrow { status: "refunded" }))
        
        (ok true)
    )
)
