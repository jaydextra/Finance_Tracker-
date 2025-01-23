// src/components/MonthPage.js
import React from 'react';

const MonthPage = ({ month, year, transactions }) => {
  // Filter transactions for this specific month/year
  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === month && tDate.getFullYear() === year;
  });

  return (
    <div className="month-page">
      {/* No summary display here */}
    </div>
  );
};

export default MonthPage;