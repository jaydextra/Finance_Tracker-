import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';

const CreditCardGraph = ({ cards, monthlyBudget, strategy = 'snowball' }) => {
  const [showInterest, setShowInterest] = useState(false);

  const calculatePayoffData = () => {
    console.group('Debt Payoff Calculation');
    console.log('Initial Setup:', {
      cards: cards,
      monthlyBudget: monthlyBudget,
      strategy: strategy
    });

    // Deep copy cards to avoid modifying original data
    let remainingCards = cards.map(card => ({
      ...card,
      balance: parseFloat(card.balance),
      interestRate: parseFloat(card.interestRate),
      minPayment: parseFloat(card.minPayment)
    }));

    // Sort cards based on strategy
    remainingCards.sort((a, b) => {
      if (strategy === 'snowball') {
        return a.balance - b.balance;
      }
      return b.interestRate - a.interestRate;
    });

    console.log('Sorted Cards:', remainingCards);

    const monthlyData = [];
    let month = 0;
    let totalInterestPaid = 0;
    let availableMoney = parseFloat(monthlyBudget);

    while (remainingCards.some(card => card.balance > 0) && month < 360) {
      console.group(`Month ${month} Calculations`);
      
      const monthInfo = {
        month,
        balances: {},
        totalBalance: 0,
        totalInterest: totalInterestPaid
      };

      // Calculate interest and minimum payments
      remainingCards.forEach(card => {
        if (card.balance > 0) {
          // Calculate monthly interest
          const monthlyInterest = (card.balance * (card.interestRate / 100)) / 12;
          totalInterestPaid += monthlyInterest;
          card.balance += monthlyInterest;

          console.log(`Card: ${card.name}`, {
            currentBalance: card.balance,
            monthlyInterest: monthlyInterest,
            minPayment: card.minPayment,
            frequency: card.frequency
          });

          // Adjust minimum payment based on frequency
          let adjustedMinPayment = card.minPayment;
          if (card.frequency === 'Bi-Weekly') {
            adjustedMinPayment = (card.minPayment * 26) / 12; // Convert bi-weekly to monthly
            console.log(`Bi-Weekly Adjustment: ${card.name}`, {
              originalMinPayment: card.minPayment,
              adjustedMonthlyPayment: adjustedMinPayment
            });
          } else if (card.frequency === 'Weekly') {
            adjustedMinPayment = (card.minPayment * 52) / 12; // Convert weekly to monthly
            console.log(`Weekly Adjustment: ${card.name}`, {
              originalMinPayment: card.minPayment,
              adjustedMonthlyPayment: adjustedMinPayment
            });
          }

          // Apply minimum payment
          const minPayment = Math.min(card.balance, adjustedMinPayment);
          card.balance -= minPayment;
          availableMoney -= minPayment;

          monthInfo.balances[card.name] = card.balance;
          monthInfo.totalBalance += card.balance;

          console.log(`After Payment: ${card.name}`, {
            appliedPayment: minPayment,
            newBalance: card.balance,
            remainingBudget: availableMoney
          });
        }
      });

      // Apply remaining money to focus card
      if (availableMoney > 0) {
        const focusCard = remainingCards.find(card => card.balance > 0);
        if (focusCard) {
          const extraPayment = Math.min(availableMoney, focusCard.balance);
          focusCard.balance = Math.max(0, focusCard.balance - extraPayment);
          console.log('Extra Payment Applied:', {
            card: focusCard.name,
            amount: extraPayment,
            newBalance: focusCard.balance
          });
        }
      }

      monthlyData.push(monthInfo);
      availableMoney = parseFloat(monthlyBudget);
      
      console.log('Month Summary:', {
        totalBalance: monthInfo.totalBalance,
        totalInterest: monthInfo.totalInterest
      });
      console.groupEnd();
      
      month++;
    }

    console.log('Final Payoff Summary:', {
      monthsToPayoff: monthlyData.length,
      totalInterestPaid: totalInterestPaid
    });
    console.groupEnd();

    return monthlyData;
  };

  const payoffData = calculatePayoffData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2d3436',
        bodyColor: '#2d3436',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: $${parseFloat(context.raw).toLocaleString()}`;
          }
        }
      },
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 6,
          font: {
            size: 12
          },
          callback: function(value) {
            return `Month ${value}`;
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const chartData = {
    labels: payoffData.map(data => data.month),
    datasets: [
      {
        label: 'Remaining Balance',
        data: payoffData.map(data => data.totalBalance.toFixed(2)),
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      },
      ...(showInterest ? [{
        label: 'Total Interest',
        data: payoffData.map(data => data.totalInterest.toFixed(2)),
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2
      }] : [])
    ]
  };

  return (
    <div className="credit-card-graph">
      <div className="graph-controls">
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            checked={showInterest}
            onChange={(e) => setShowInterest(e.target.checked)}
            id="showInterestToggle"
          />
          <label className="form-check-label" htmlFor="showInterestToggle">
            Show Interest Accumulation
          </label>
        </div>
      </div>
      <div className="chart-container" style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="payoff-summary">
        <div className="summary-item">
          <span>Months to Pay Off:</span>
          <strong>{payoffData.length}</strong>
        </div>
        <div className="summary-item">
          <span>Total Interest:</span>
          <strong>${payoffData[payoffData.length - 1].totalInterest.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
};

export default CreditCardGraph; 