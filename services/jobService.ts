
import { Job } from '../types';

/**
 * Fetch the list of jobs from the backend API.
 *
 * The backend is served by ``backend/server.py`` and will respond with
 * a JSON array of jobs.  Each job includes a ``skills`` field as an
 * array of strings so no additional parsing is required.  If the
 * request fails or the server is unreachable this function will
 * propagate an exception.
 */
export const fetchJobs = async (): Promise<Job[]> => {
  const response = await fetch('http://localhost:8000/jobs');
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data as Job[];
};
