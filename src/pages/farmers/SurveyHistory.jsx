import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCachedFetch } from '../../hooks/useCachedFetch';
import { farmerApi } from '../../api/farmerApi';
import formatDate from '../../utils/formatDate';
import {
  CACHE_TAGS,
  SWR_FRESH_MS,
  SWR_STALE_MS,
  cacheKeyFarmerSurveyHistory,
} from '../../cache/cacheKeys';

const SurveyHistory = () => {
  const [searchParams] = useSearchParams();
  const farmerId = (searchParams.get('farmerId') || '').trim();

  const fetchHistory = useCallback(
    () => farmerApi.getSurveyHistory(farmerId),
    [farmerId]
  );
  const cacheOpts = useMemo(
    () => ({
      swr: true,
      freshMs: SWR_FRESH_MS,
      staleMs: SWR_STALE_MS,
      tags: [CACHE_TAGS.FARMER_SURVEY_HISTORY],
    }),
    []
  );

  const { data: surveys, loading, error } = useCachedFetch(
    farmerId ? cacheKeyFarmerSurveyHistory(farmerId) : null,
    fetchHistory,
    cacheOpts
  );

  const [search, setSearch] = useState('');

  if (!farmerId) {
    return (
      <div className="table-container">
        <div className="table-header">
          <h2>Previous History of Farmer&apos;s Form</h2>
        </div>
        <p className="empty-state" style={{ padding: '1rem' }}>
          Open this page with a farmer id, for example:{' '}
          <code>?farmerId=123</code> (from the farmers list or detail view).
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error">Failed to load surveys: {error}</div>;
  }

  const list = Array.isArray(surveys) ? surveys : surveys?.data ?? surveys?.content ?? [];
  const surveyData = list.length
    ? list
    : [
        {
          id: 1,
          farmerName: 'Ramesh Patil',
          village: 'Molkhi',
          date: '2024-03-15',
          status: 'Completed',
        },
        {
          id: 2,
          farmerName: 'Anita Desai',
          village: 'Boro',
          date: '2024-03-14',
          status: 'Pending',
        },
        {
          id: 3,
          farmerName: 'Suresh Kumar',
          village: 'Rammati',
          date: '2024-03-13',
          status: 'Completed',
        },
      ];

  const filteredData = surveyData.filter((s) =>
    [s.farmerName, s.village, s.status, String(s.id)]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="table-container">
        <div className="table-header">
          <h2>Previous History of Farmer&apos;s Form</h2>
          <input
            type="text"
            placeholder="Search..."
            className="search-box"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredData.length === 0 ? (
          <div className="empty-state">No survey records found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Survey ID</th>
                <th>Farmer Name</th>
                <th>Village</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((survey) => (
                <tr key={survey.id}>
                  <td>#{survey.id}</td>
                  <td>{survey.farmerName}</td>
                  <td>{survey.village}</td>
                  <td>{formatDate(survey.date)}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        survey.status === 'Completed' ? 'delivered' : 'pending'
                      }`}
                    >
                      {survey.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button type="button" className="btn-icon" title="View">
                        👁️
                      </button>
                      <button type="button" className="btn-icon" title="Download">
                        ⬇️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SurveyHistory;
