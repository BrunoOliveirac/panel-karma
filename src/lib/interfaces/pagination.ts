export interface Pagination<T> {
  /** The items of the pagination */
  items: T[];
  /** The total number of pages */
  totalPages: number;
  // /** The page of the pagination */
  // page: number;
  // /** The total number of items */
  // total: number;
}
