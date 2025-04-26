import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Mock data for testing
const mockDispute = {
  initiator: "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG",
  reason: "Payment not received",
  "created-at": 11000,
  resolved: false
};

Clarinet.test({
  name: "set-test-dispute stores dispute information correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    // Create a test dispute
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-disputes",
        "set-test-dispute",
        [types.uint(1), types.principal(mockDispute.initiator), types.ascii(mockDispute.reason), 
         types.uint(mockDispute["created-at"]), types.bool(mockDispute.resolved)],
        deployer.address
      )
    ]);

    const result = chain.callReadOnlyFn(
      "marketplace-disputes",
      "get-dispute",
      [types.uint(1)],
      deployer.address
    );

    // Verify dispute details
    const dispute = result.result.expectOk().expectTuple();
    assertEquals(dispute.initiator, mockDispute.initiator);
    assertEquals(dispute.reason, mockDispute.reason);
    assertEquals(dispute["created-at"], mockDispute["created-at"]);
    assertEquals(dispute.resolved, types.bool(mockDispute.resolved));
  }
});

Clarinet.test({
  name: "get-dispute returns null for non-existing dispute",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;

    const result = chain.callReadOnlyFn(
      "marketplace-disputes",
      "get-dispute",
      [types.uint(999)], // Non-existent dispute ID
      deployer.address
    );

    // Verify that the dispute is not found
    result.result.expectOk().expectNone();
  }
});

Clarinet.test({
  name: "resolve dispute correctly updates the status",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    // Create a test dispute
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-disputes",
        "set-test-dispute",
        [types.uint(1), types.principal(mockDispute.initiator), types.ascii(mockDispute.reason), 
         types.uint(mockDispute["created-at"]), types.bool(mockDispute.resolved)],
        deployer.address
      ),
    ]);

    // Resolve dispute
    chain.mineBlock([
      Tx.contractCall(
        "marketplace-disputes",
        "resolve-dispute",
        [types.uint(1)],
        deployer.address
      )
    ]);

    const result = chain.callReadOnlyFn(
      "marketplace-disputes",
      "get-dispute",
      [types.uint(1)],
      deployer.address
    );

    // Verify dispute status is updated
    const dispute = result.result.expectOk().expectTuple();
    assertEquals(dispute.resolved, types.bool(true)); // The dispute should now be marked as resolved
  }
});
