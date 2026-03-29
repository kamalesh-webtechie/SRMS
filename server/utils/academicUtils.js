/**
 * Maps an academic Year ('I', 'II', 'III', 'IV') to its corresponding semesters.
 */
function getSemestersFromYear(year) {
    const map = {
        'I': [1, 2],
        'II': [3, 4],
        'III': [5, 6],
        'IV': [7, 8],
    };
    return map[year] || [];
}

/**
 * Maps a Semester number (1-8) to its academic Year (I, II, III, IV).
 */
function getYearFromSemester(semester) {
    const sem = Number(semester);
    if (sem <= 2) return 'I';
    if (sem <= 4) return 'II';
    if (sem <= 6) return 'III';
    if (sem <= 8) return 'IV';
    return 'I';
}

module.exports = {
    getSemestersFromYear,
    getYearFromSemester
};
