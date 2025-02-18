export function formatDate(dateString, format = 'MMM YYYY') {
    if (dateString === 'Present') return dateString;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
    });
}

export function parseDate(displayDate) {
    if (displayDate === 'Present') return displayDate;
    
    const date = new Date(displayDate);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
}
