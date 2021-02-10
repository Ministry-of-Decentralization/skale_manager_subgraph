# Subgraph for the Skale Network

Indexed data on the Validators, Nodes, Stakes, and Delegators that constitute the Skale Network

### To Run Locally
To run the subgraph locally you need to run the graph node locally and connect to a mainnet node that supports the trace_filter API. This subgraph has been developed using ghe Alchemy API serice.

#### Configure the Ethereum Mainnet node
in `docker-compose.yaml` replace `NODE_ENDPOINT` with your mainnet rpc endpoint

#### Run the Graph Node
`docker-compose up`

#### Deploy the Subgraph
`yarn`
`yarn codgen`
`yarn build`
`yarn create-local`
`yarn deploy-local`

If successful the subgraph will be avaiable to query at http://127.0.0.1:8000/subgraphs/name/Ministry-Of-Decentralization/skale_manager_subgraph
