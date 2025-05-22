export {};
declare global {
  interface PaginationDefaultI {
    limit?: number;
    offset?: number;
    count?: number; // from API
    itemCount?: number; // for PF pagination
  }
}
