/**
 * Academic Metadata Utilities
 * Centralized logic for Years, Semesters, and Batches to ensure consistency across the application.
 */

export const YEARS = ['I', 'II', 'III', 'IV'];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Maps a Year (I, II, III, IV) to its corresponding semesters.
 */
export const getSemestersForYear = (year) => {
    switch (year) {
        case 'I': return [1, 2];
        case 'II': return [3, 4];
        case 'III': return [5, 6];
        case 'IV': return [7, 8];
        default: return [];
    }
};

/**
 * Maps a Semester (1-8) to its academic Year.
 */
export const getYearForSemester = (semester) => {
    const sem = parseInt(semester);
    if (sem <= 2) return 'I';
    if (sem <= 4) return 'II';
    if (sem <= 6) return 'III';
    if (sem <= 8) return 'IV';
    return 'I';
};

/**
 * Generates the list of active batches currently on campus.
 * Academic context: Usually 4 cohorts are present at any time.
 * If current year is 2026:
 * - 4th Year: 2022-2026
 * - 3rd Year: 2023-2027
 * - 2nd Year: 2024-2028
 * - 1st Year: 2025-2029
 * 
 * @param {Date} date - The reference date (defaults to now)
 * @returns {string[]} Array of batch strings like ["2025-2029", "2024-2028", ...]
 */
export const getActiveBatches = (date = new Date()) => {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth(); // 0-11

    // Academic year cycle: 
    // New batch joins in Summer (Month 5/6/7)
    // If it's early in the calendar year (Jan-May), the "current" newest batch joined last year.
    // However, the user specifically noted 2022-2026 is the relevant senior batch.

    const batches = [];
    const COURSES_DURATION = 4;

    // Logic to determine the newest enrolled batch start year
    // If we are in March 2026, the 1st years joined in 2025.
    // If we are in September 2026, the 1st years joined in 2026.
    let baseYear = currentYear;
    if (currentMonth < 5) { // Before June, the latest intake was last year
        baseYear = currentYear - 1;
    }

    for (let i = 0; i < COURSES_DURATION; i++) {
        const start = baseYear - i;
        const end = start + COURSES_DURATION;
        batches.push(`${start}-${end}`);
    }

    return batches; // Returns newest first (e.g. 2025-2029, 2024-2028...)
};

/**
 * Formats a batch string or extracts the start year.
 */
export const getBatchStartYear = (batch) => {
    if (!batch) return null;
    const parts = batch.split('-');
    return parseInt(parts[0]);
};
