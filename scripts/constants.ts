export const ONE_MINUTE = 60;

export const ONE_HOUR = ONE_MINUTE * 60;
export const TWO_HOURS = ONE_HOUR * 2;

export const ONE_DAY = ONE_HOUR * 24;
export const TWO_DAY = ONE_DAY * 2;
export const THREE_DAY = ONE_DAY * 3;
export const ONE_WEEK = ONE_DAY * 7;

export const ONE_MONTH = ONE_DAY * 30;

export const ROLES = {
  ADMIN: "0xb055000000000000000000000000000000000000000000000000000000000000",
  CLAIMER_ROLE:
    "0xdeb7000000000000000000000000000000000000000000000000000000000000",
};

export const Errors = {
  NOT_EVENLY: "0", // Total supply not divisible evenly among recipients
  ALREADY_CLAIMED: "1", // You have already claimed your airdrop
  STILL_LOCKED: "2", // Your tokens are still locked
  ZERO_ADDRESS: "3", // Address should not be zero
  NO_RECIPIENTS: "4", // Should provide at least one recipient
  INSUFFICIENT_BALANCE: "5", // Claimed token amount should be less or equal to contract token's balance
  ZERO_AMOUNT: "6" // Amount is zero
};
