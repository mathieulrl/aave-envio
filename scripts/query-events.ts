import { GraphQLClient, gql } from 'graphql-request';

// Replace with your actual endpoint
const ENDPOINT = 'https://indexer.dev.hyperindex.xyz/c863b14/v1/graphql';

const client = new GraphQLClient(ENDPOINT);

// Fetch Mint, Burn, Transfer events (use `db_write_timestamp` or `blockNumber` to paginate)
const query = gql`
  query GetRecentEvents {
    ATokenInstance_Mint(order_by: {db_write_timestamp: asc}, limit: 10) {
      caller
      onBehalfOf
      value
      db_write_timestamp
    }
    ATokenInstance_Burn(order_by: {db_write_timestamp: asc}, limit: 10) {
      from
      target
      value
      db_write_timestamp
    }
    ATokenInstance_Transfer(order_by: {db_write_timestamp: asc}, limit: 10) {
      from
      to
      value
      db_write_timestamp
    }
  }
`

async function main() {
  const { ATokenInstance_Mint, ATokenInstance_Burn, ATokenInstance_Transfer } = await client.request(query) as any

  for (const event of ATokenInstance_Mint) {

    console.log(`Mint event: ${JSON.stringify(event)}`);
    // Treat this as a deposit
    // await _updatePositionBalancesAndSnapshot(
    //   event.onBehalfOf,         // Treat as position ID or map it
    //   event.value,              // New deposit amount
    //   event.value               // Could assume lastBalance = deposit for fresh users
    // )
  }

  for (const event of ATokenInstance_Burn) {
    // Treat as a withdrawal — reduce deposited balance
    console.log(`Burn event: ${JSON.stringify(event)}`);
    // await _updatePositionBalancesAndSnapshot(
    //   event.from,
    //   '0',                     // Deposited balance reduced fully (or calculate delta)
    //   event.value              // Update to lastBalance = actual balance
    // )
  }

  // You could optionally ignore raw Transfer events if Mint/Burn fully covers your logic
  for (const event of ATokenInstance_Transfer) {
    // Handle transfers if needed, e.g., updating balances between users
    console.log(`Transfer event: ${JSON.stringify(event)}`);
    // await _updatePositionBalancesAndSnapshot(
    //   event.from,              // Sender position ID
    //   '-' + event.value,       // Reduce sender's balance
    //   event.value              // Update receiver's balance
    // )
  }
}

main().catch(console.error)
