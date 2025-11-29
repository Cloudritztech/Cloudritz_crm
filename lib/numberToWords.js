export const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };
  
  if (num === 0) return 'Zero';
  
  let result = '';
  let crores = Math.floor(num / 10000000);
  num %= 10000000;
  let lakhs = Math.floor(num / 100000);
  num %= 100000;
  let thousands = Math.floor(num / 1000);
  num %= 1000;
  
  if (crores > 0) {
    result += convertHundreds(crores) + 'Crore ';
  }
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + 'Lakh ';
  }
  if (thousands > 0) {
    result += convertHundreds(thousands) + 'Thousand ';
  }
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim();
};