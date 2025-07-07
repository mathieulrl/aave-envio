import assert from "assert";
import { 
  TestHelpers,
  ATokenInstance_Approval
} from "generated";
const { MockDb, ATokenInstance } = TestHelpers;

describe("ATokenInstance contract Approval event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ATokenInstance contract Approval event
  const event = ATokenInstance.Approval.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ATokenInstance_Approval is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ATokenInstance.Approval.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualATokenInstanceApproval = mockDbUpdated.entities.ATokenInstance_Approval.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedATokenInstanceApproval: ATokenInstance_Approval = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      owner: event.params.owner,
      spender: event.params.spender,
      value: event.params.value,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualATokenInstanceApproval, expectedATokenInstanceApproval, "Actual ATokenInstanceApproval should be the same as the expectedATokenInstanceApproval");
  });
});
