const formatPhoneNumber = (rawNumber) => {
    if (!rawNumber) return '';

    const cleaned = rawNumber.replace(/\D/g, ''); // remove non-digits

    if (cleaned.length < 9) return rawNumber; // fallback if too short

    const countryCode = cleaned.slice(0, 3);  // 383
    const operator = cleaned.slice(3, 5);     // 44
    const part1 = cleaned.slice(5, 8);        // 450
    const part2 = cleaned.slice(8);           // 209

    return `+ (${countryCode}) ${operator} ${part1} ${part2}`;
};
export default formatPhoneNumber