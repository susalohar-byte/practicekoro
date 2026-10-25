/**
 * Student catalog, test-taking, attempts, mistakes & bookmarks API.
 * Methods extracted verbatim from the original src/services/api.ts.
 *
 * Assembly only: method bodies live in the catalog.* section modules.
 * The exported `catalogApi` shape (keys + order) is unchanged.
 */
import { catalogContentApi } from './catalog.content';
import { catalogTestsApi } from './catalog.tests';
import { catalogAttemptsApi } from './catalog.attempts';
import { catalogResultsApi } from './catalog.results';
import { catalogReviewApi } from './catalog.review';
import { catalogSeriesApi } from './catalog.series';

export const catalogApi = {
  ...catalogContentApi,
  ...catalogTestsApi,
  ...catalogAttemptsApi,
  ...catalogResultsApi,
  ...catalogReviewApi,
  ...catalogSeriesApi,
};
