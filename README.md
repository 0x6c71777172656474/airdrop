# Claim-based airdrop contract example

Contract is designed to execute an airdrop of a specific ERC20 token to a pre-defined list of recipient addresses. The contract includes security measures such as role-based access control, time locks for claims, and protection against duplicate claims, ensuring a fair and secure token distribution.

To build project and run tests use following commands:

```shell
git clone https://github.com/0x6c71777172656474/airdrop.git
cd airdrop
npm install
npm test
```
Every claimer will have fixed claiming amount depends on total recipients in corresponding time 🚀
