// src/App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Collapse, Button, Card, Nav } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import MonthPage from './components/MonthPage';
import CreditCardTracker from './components/CreditCardTracker';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Create theme context
const ThemeContext = createContext();

// Add this before the App component
export const useTheme = () => useContext(ThemeContext);

function App() {
  const [transactions, setTransactions] = useState([]);
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('Monthly');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [chart, setChart] = useState(null);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isIncomeListOpen, setIsIncomeListOpen] = useState(true);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingValues, setEditingValues] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [allMonthsTransactions, setAllMonthsTransactions] = useState({});
  const [activeTab, setActiveTab] = useState('budget');

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Load transactions from localStorage on component mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Clean up chart on component unmount
  useEffect(() => {
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [chart]);

  // Add this new useEffect to handle localStorage for allMonthsTransactions
  useEffect(() => {
    const savedMonthsTransactions = localStorage.getItem('allMonthsTransactions');
    if (savedMonthsTransactions) {
      setAllMonthsTransactions(JSON.parse(savedMonthsTransactions));
    }
  }, []);

  // Add this useEffect to save allMonthsTransactions when it changes
  useEffect(() => {
    localStorage.setItem('allMonthsTransactions', JSON.stringify(allMonthsTransactions));
  }, [allMonthsTransactions]);

  // Update the chart update useEffect
  useEffect(() => {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    // Destroy existing chart
    if (chart) {
      chart.destroy();
    }

    // Get all transactions for the current month
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthTransactions = allMonthsTransactions[monthKey] || [];
    
    // Combine regular and monthly transactions
    const allTransactions = [
      ...transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      }),
      ...monthTransactions
    ];

    const categoryTotals = allTransactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense' && !transaction.skipped) {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      }
      return acc;
    }, {});

    // Only create new chart if there's data to display
    if (Object.keys(categoryTotals).length > 0) {
      const newChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(categoryTotals),
          datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 206, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            datalabels: {
              formatter: (value) => `$${value.toFixed(2)}`,
              color: 'white',
              font: { 
                weight: 'bold',
                size: 12
              }
            },
            legend: {
              position: 'right',
              labels: {
                color: isDarkMode ? '#ffffff' : '#666666',
                font: {
                  size: 12
                }
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });

      setChart(newChart);
    }
  }, [currentMonth, currentYear, transactions, allMonthsTransactions, isDarkMode]);

  // Separate submit handlers for income and expenses
  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (!incomeDescription || !incomeAmount) {
      alert("Please fill in all required fields.");
      return;
    }

    const newIncome = {
      id: Date.now(),
      description: incomeDescription,
      amount: parseFloat(incomeAmount),
      type: 'income',
      date: new Date().toISOString(),
      frequency: 'Monthly', // Add default frequency for income
      dueDate: new Date().toISOString().split('T')[0] // Add current date as due date
    };

    // Use addTransaction instead of directly updating transactions
    addTransaction(newIncome, 'income');
    
    // Clear form
    setIncomeDescription('');
    setIncomeAmount('');
    alert('Income added successfully!');
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseDescription || !expenseAmount || !dueDate || !category) {
      alert("Please fill in all required fields.");
      return;
    }

    const newExpense = {
      id: Date.now(),
      description: expenseDescription,
      amount: parseFloat(expenseAmount),
      type: 'expense',
      category,
      dueDate,
      frequency,
      paid: false,
      skipped: false,
      date: new Date().toISOString()
    };

    // Use addTransaction instead of directly updating transactions
    addTransaction(newExpense, 'expense');
    
    // Clear form
    setExpenseDescription('');
    setExpenseAmount('');
    alert('Expense added successfully!');
  };

  const togglePaid = (id) => {
    // Check if the transaction is in allMonthsTransactions
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthTransactions = allMonthsTransactions[monthKey] || [];
    const monthTransaction = monthTransactions.find(t => t.id === id);

    if (monthTransaction) {
      // Update in allMonthsTransactions
      setAllMonthsTransactions(prev => ({
        ...prev,
        [monthKey]: prev[monthKey].map(t =>
          t.id === id ? { ...t, paid: !t.paid, skipped: false } : t
        )
      }));
    } else {
      // Update in regular transactions
      setTransactions(transactions.map(t =>
        t.id === id ? { ...t, paid: !t.paid, skipped: false } : t
      ));
    }
  };

  const toggleSkipped = (id) => {
    setTransactions(transactions.map(t => 
      t.id === id ? { ...t, skipped: !t.skipped, paid: false } : t
    ));
  };

  const deleteTransaction = (transactionId, fromMonth) => {
    if (window.confirm('Delete this transaction?')) {
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        // Check in allMonthsTransactions if not found in transactions
        const monthKey = `${currentYear}-${fromMonth}`;
        const monthTransactions = allMonthsTransactions[monthKey] || [];
        const monthTransaction = monthTransactions.find(t => t.id === transactionId);
        
        if (monthTransaction?.originalTransactionId) {
          // If it's a recurring transaction, ask if they want to delete all future occurrences
          const deleteAll = window.confirm(
            'Delete all future occurrences of this recurring transaction?'
          );
          
          if (deleteAll) {
            // Delete from current month forward
            const updatedMonthsTransactions = { ...allMonthsTransactions };
            Object.keys(updatedMonthsTransactions).forEach(monthKey => {
              const [year, month] = monthKey.split('-').map(Number);
              if (year > currentYear || (year === currentYear && month >= fromMonth)) {
                updatedMonthsTransactions[monthKey] = updatedMonthsTransactions[monthKey]
                  .filter(t => t.originalTransactionId !== monthTransaction.originalTransactionId);
              }
            });
            setAllMonthsTransactions(updatedMonthsTransactions);
          } else {
            // Delete only this occurrence
            setAllMonthsTransactions(prev => ({
              ...prev,
              [monthKey]: prev[monthKey].filter(t => t.id !== transactionId)
            }));
          }
        } else {
          // Handle one-time transaction deletion
          setAllMonthsTransactions(prev => ({
            ...prev,
            [monthKey]: prev[monthKey].filter(t => t.id !== transactionId)
          }));
        }
      } else {
        // Handle deletion from regular transactions array
        setTransactions(transactions.filter(t => t.id !== transactionId));
      }
    }
  };

  // Update the filterTransactions function to properly combine both sources
  const filterTransactions = (type) => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthTransactions = allMonthsTransactions[monthKey] || [];
    
    // Get transactions from both sources
    const regularTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === type && 
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    const recurringTransactions = monthTransactions.filter(t => t.type === type);
    
    // Combine and remove duplicates
    const combined = [...regularTransactions, ...recurringTransactions];
    return combined.filter((transaction, index, self) =>
      index === self.findIndex(t => t.id === transaction.id)
    );
  };

  // Update calculateTotals to include both regular and recurring transactions
  const calculateTotals = () => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthTransactions = allMonthsTransactions[monthKey] || [];
    
    const regularTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    const allTransactions = [...regularTransactions, ...monthTransactions];

    return {
      income: allTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
      expenses: allTransactions
        .filter(t => t.type === 'expense' && !t.skipped)
        .reduce((sum, t) => sum + t.amount, 0),
      paid: allTransactions
        .filter(t => t.paid)
        .reduce((sum, t) => sum + t.amount, 0)
    };
  };

  // Update the saveEdit function
  const saveEdit = (id) => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const isMonthTransaction = allMonthsTransactions[monthKey]?.some(t => t.id === id);
    
    if (isMonthTransaction) {
      // Handle editing recurring transactions
      if (editingValues.originalTransactionId) {
        const editFuture = window.confirm(
          'Do you want to apply these changes to all future occurrences?'
        );
        
        if (editFuture) {
          // Update all future occurrences
          const updatedMonthsTransactions = { ...allMonthsTransactions };
          Object.keys(updatedMonthsTransactions).forEach(key => {
            const [year, month] = key.split('-').map(Number);
            if (year > currentYear || (year === currentYear && month >= currentMonth)) {
              updatedMonthsTransactions[key] = updatedMonthsTransactions[key].map(t =>
                t.originalTransactionId === editingValues.originalTransactionId
                  ? { ...t, ...editingValues }
                  : t
              );
            }
          });
          setAllMonthsTransactions(updatedMonthsTransactions);
        } else {
          // Update only this occurrence
          setAllMonthsTransactions(prev => ({
            ...prev,
            [monthKey]: prev[monthKey].map(t =>
              t.id === id ? { ...t, ...editingValues } : t
            )
          }));
        }
      } else {
        // Update one-time transaction
        setAllMonthsTransactions(prev => ({
          ...prev,
          [monthKey]: prev[monthKey].map(t =>
            t.id === id ? { ...t, ...editingValues } : t
          )
        }));
      }
    } else {
      // Handle regular transactions
      setTransactions(transactions.map(t => 
        t.id === id ? { ...t, ...editingValues } : t
      ));
    }
    
    setEditingId(null);
    setEditingValues({});
  };

  // Update the startEditing function
  const startEditing = (transaction) => {
    setEditingId(transaction.id);
    setEditingValues({
      ...transaction,
      amount: transaction.amount.toString()
    });
  };

  // Add this function to cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditingValues({});
  };

  // Add this helper function at the top of your App component
  const getDayWithSuffix = (date) => {
    const day = new Date(date).getDate();
    if (day > 3 && day < 21) return day + 'th';
    switch (day % 10) {
      case 1: return day + "st";
      case 2: return day + "nd";
      case 3: return day + "rd";
      default: return day + "th";
    }
  };

  // Add this function in your App component
  const getMonthlyTrends = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    return {
      labels: last6Months.map(date => months[date.getMonth()]),
      expenses: last6Months.map(date => {
        return transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && 
                   tDate.getMonth() === date.getMonth() &&
                   !t.skipped;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      }),
      income: last6Months.map(date => {
        return transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'income' && 
                   tDate.getMonth() === date.getMonth();
          })
          .reduce((sum, t) => sum + t.amount, 0);
      })
    };
  };

  // Update the generateRecurringDates function
  const generateRecurringDates = (startDate, frequency, endDate) => {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    // Set both dates to start of day for accurate comparison
    currentDate.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    console.log('Generating recurring dates:', {
      startDate: currentDate,
      endDate: end,
      frequency
    });

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      
      // Store the original day of month
      const originalDay = currentDate.getDate();
      
      // Calculate next date based on frequency
      switch (frequency) {
        case 'Weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'Bi-Weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'Monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          // Check if we've rolled over to the next month
          if (currentDate.getDate() !== originalDay) {
            // We've hit the end of the month, go back to last day of previous month
            currentDate.setDate(0);
          }
          break;
        default:
          return dates;
      }

      console.log(`Added ${frequency} date:`, new Date(currentDate));
    }

    console.log('Generated dates:', dates);
    return dates;
  };

  // Update the addTransaction function
  const addTransaction = (transaction, type) => {
    const endOfYear = new Date(currentYear, 11, 31);
    const isRecurring = transaction.frequency !== 'One-time';
    const startDate = new Date(transaction.dueDate);
    
    console.log('Adding transaction:', {
      transaction,
      type,
      isRecurring,
      startDate,
      endOfYear
    });

    if (isRecurring) {
      const recurringDates = generateRecurringDates(
        startDate,
        transaction.frequency,
        endOfYear
      );

      console.log('Generated recurring dates:', recurringDates.length);

      // Group transactions by month
      const transactionsByMonth = {};
      recurringDates.forEach(date => {
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!transactionsByMonth[monthKey]) {
          transactionsByMonth[monthKey] = [];
        }

        const recurringTransaction = {
          ...transaction,
          id: Date.now() + Math.random(), // Ensure unique IDs
          dueDate: date.toISOString().split('T')[0],
          originalTransactionId: transaction.id,
          paid: false // Reset paid status for each occurrence
        };

        transactionsByMonth[monthKey].push(recurringTransaction);
      });

      console.log('Transactions grouped by month:', transactionsByMonth);

      // Update allMonthsTransactions
      setAllMonthsTransactions(prev => {
        const updated = { ...prev };
        Object.entries(transactionsByMonth).forEach(([monthKey, transactions]) => {
          if (!updated[monthKey]) {
            updated[monthKey] = [];
          }
          updated[monthKey] = [...updated[monthKey], ...transactions];
        });
        return updated;
      });

    } else {
      // Handle one-time transactions
      const transactionDate = new Date(transaction.dueDate);
      const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;
      
      setAllMonthsTransactions(prev => ({
        ...prev,
        [monthKey]: [...(prev[monthKey] || []), { ...transaction, paid: false }]
      }));
    }
  };

  // In App.js, update the summary calculation
  const calculateSummary = (transactions) => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const paidIncome = transactions
      .filter(t => t.type === 'income' && t.paid)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = paidIncome - expenses;

    return { income, paidIncome, expenses, balance };
  };

  return (
    <div className={`App ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="finance-header">
        <div className="theme-toggle">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle-btn"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <i className={`fas fa-${isDarkMode ? 'sun' : 'moon'}`}></i>
          </button>
        </div>
        <h1 className="gradient-text">Finance Tracker</h1>
        
        {/* Update the navigation section */}
        <div className="app-navigation">
          {/* Main Tabs */}
          <Nav variant="tabs" className="main-nav">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'budget'}
                onClick={() => setActiveTab('budget')}
              >
                <i className="fas fa-wallet me-2"></i>
                Budget Tracker
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'credit'}
                onClick={() => setActiveTab('credit')}
              >
                <i className="fas fa-credit-card me-2"></i>
                Credit Cards
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {/* Month Navigation - Only show for budget tab */}
          {activeTab === 'budget' && (
            <div className="month-navigation">
              <button 
                className="nav-btn prev"
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentYear(prev => prev - 1);
                    setCurrentMonth(11);
                  } else {
                    setCurrentMonth(prev => prev - 1);
                  }
                }}
                aria-label="Previous month"
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              
              <div className="month-select">
                <select 
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="month-dropdown"
                  aria-label="Select month"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                <select 
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="year-dropdown"
                  aria-label="Select year"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={currentYear - 2 + i}>
                      {currentYear - 2 + i}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                className="nav-btn next"
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentYear(prev => prev + 1);
                    setCurrentMonth(0);
                  } else {
                    setCurrentMonth(prev => prev + 1);
                  }
                }}
                aria-label="Next month"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Conditional Rendering based on active tab */}
      {activeTab === 'budget' ? (
        <>
          {/* Updated Summary Card */}
          <div className="row mb-4">
            {/* Summary Stats - Simplified */}
            <div className="mobile-summary">
              <div className="stat-card">
                <div className="stat-row income">
                  <div className="stat-label">Income</div>
                  <div className="stat-value">${calculateTotals().income.toFixed(2)}</div>
                </div>
                <div className="stat-row expenses">
                  <div className="stat-label">Expenses</div>
                  <div className="stat-value">${calculateTotals().expenses.toFixed(2)}</div>
                </div>
                <div className="stat-row balance">
                  <div className="stat-label">Balance</div>
                  <div className="stat-value">${(calculateTotals().income - calculateTotals().expenses).toFixed(2)}</div>
                </div>
              </div>
              
              {/* Single Chart - Most Important View */}
              <div className="chart-section">
                <h3>Expense Breakdown</h3>
                <div className="chart-container">
                  <canvas id="expenseChart"></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Section - Side by Side */}
          <div className="row">
            {/* Expense Form */}
            <div className="col-md-8 mb-4">
              <Card>
                <Card.Header className="bg-danger text-white">
                  <Button
                    onClick={() => setIsExpenseOpen(!isExpenseOpen)}
                    aria-controls="expenseForm"
                    aria-expanded={isExpenseOpen}
                    variant="link"
                    className="text-white w-100 text-start p-0"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <h3 className="mb-0">Expenses</h3>
                        <i className={`fas fa-caret-${isExpenseOpen ? 'down' : 'right'} ms-2 fa-lg`}></i>
                      </div>
                    </div>
                  </Button>
                </Card.Header>
                <Collapse in={isExpenseOpen}>
                  <div id="expenseForm">
                    <Card.Body>
                      <form onSubmit={handleExpenseSubmit} className="transaction-form">
                        <input
                          type="text"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          placeholder="Expense Item"
                          className="form-control"
                          required
                        />
                        <input
                          type="number"
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(e.target.value)}
                          placeholder="Amount"
                          step="0.01"
                          className="form-control"
                          required
                        />
                        <select 
                          value={category} 
                          onChange={(e) => setCategory(e.target.value)}
                          className="form-select"
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Bills">Bills</option>
                          <option value="Savings">Savings</option>
                          <option value="Personal">Personal</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="form-control"
                          required
                        />
                        <select 
                          value={frequency} 
                          onChange={(e) => setFrequency(e.target.value)}
                          className="form-select"
                          required
                        >
                          <option value="">Select Frequency</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Bi-Weekly">Bi-Weekly</option>
                          <option value="Weekly">Weekly</option>
                        </select>
                        <button type="submit" className="btn btn-danger">
                          Add Expense
                        </button>
                      </form>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </div>

            {/* Income Form */}
            <div className="col-md-4 mb-4">
              <Card>
                <Card.Header className="bg-success text-white">
                  <Button
                    onClick={() => setIsIncomeOpen(!isIncomeOpen)}
                    aria-controls="incomeSection"
                    aria-expanded={isIncomeOpen}
                    variant="link"
                    className="text-white w-100 text-start p-0"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <h3 className="mb-0">Income</h3>
                        <i className={`fas fa-caret-${isIncomeOpen ? 'down' : 'right'} ms-2 fa-lg`}></i>
                      </div>
                    </div>
                    <div className="current-income-display mt-2">
                      Total Monthly Income: ${calculateTotals().income.toFixed(2)}
                    </div>
                  </Button>
                </Card.Header>
                <Collapse in={isIncomeOpen}>
                  <div id="incomeSection">
                    <Card.Body>
                      <form onSubmit={handleIncomeSubmit} className="transaction-form mb-4">
                        <input
                          type="text"
                          value={incomeDescription}
                          onChange={(e) => setIncomeDescription(e.target.value)}
                          placeholder="Income Source"
                          className="form-control"
                          required
                        />
                        <input
                          type="number"
                          value={incomeAmount}
                          onChange={(e) => setIncomeAmount(e.target.value)}
                          placeholder="Amount"
                          step="0.01"
                          className="form-control"
                          required
                        />
                        <button type="submit" className="btn btn-success">
                          Add Income
                        </button>
                      </form>
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Paid</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterTransactions('income').map(transaction => (
                              <tr key={transaction.id}>
                                <td>
                                  {editingId === transaction.id ? (
                                    <input
                                      type="text"
                                      value={editingValues.description || ''}
                                      onChange={(e) => setEditingValues({
                                        ...editingValues,
                                        description: e.target.value
                                      })}
                                      className="form-control form-control-sm"
                                    />
                                  ) : (
                                    transaction.description
                                  )}
                                </td>
                                <td>
                                  {editingId === transaction.id ? (
                                    <input
                                      type="number"
                                      value={editingValues.amount || ''}
                                      onChange={(e) => setEditingValues({
                                        ...editingValues,
                                        amount: parseFloat(e.target.value)
                                      })}
                                      className="form-control form-control-sm"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span className="text-success">${transaction.amount.toFixed(2)}</span>
                                  )}
                                </td>
                                <td>
                                  <div className="expense-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={transaction.paid}
                                      onChange={() => togglePaid(transaction.id)}
                                      id={`paid-income-${transaction.id}`}
                                    />
                                    <label className="checkmark" htmlFor={`paid-income-${transaction.id}`}></label>
                                  </div>
                                </td>
                                <td>
                                  {editingId === transaction.id ? (
                                    <>
                                      <button
                                        onClick={() => saveEdit(transaction.id)}
                                        className="btn-icon"
                                        title="Save changes"
                                      >
                                        <i className="fas fa-save"></i>
                                        <span>Save</span>
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="btn-icon delete"
                                        title="Cancel editing"
                                      >
                                        <i className="fas fa-times"></i>
                                        <span>Cancel</span>
                                      </button>
                                    </>
                                  ) : (
                                    <div className="expense-actions">
                                      <button
                                        onClick={() => startEditing(transaction)}
                                        className="btn-icon"
                                        title="Edit this entry"
                                      >
                                        <i className="fas fa-edit"></i>
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        onClick={() => deleteTransaction(transaction.id, currentMonth)}
                                        className="btn-icon delete"
                                        title="Delete this entry"
                                      >
                                        <i className="fas fa-trash"></i>
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </div>
                </Collapse>
              </Card>
            </div>
          </div>

          {/* Full Width Expenses List */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header bg-danger text-white">
                  <h3 className="mb-0">Expenses List</h3>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    {/* Mobile-Friendly Expense List */}
                    <div className="expense-list">
                      {filterTransactions('expense').map(transaction => (
                        <div key={transaction.id} className={`expense-item ${transaction.paid ? 'paid' : ''}`}>
                          <div className="expense-main">
                            <div className="expense-checkbox">
                              <input
                                type="checkbox"
                                checked={transaction.paid}
                                onChange={() => togglePaid(transaction.id)}
                                id={`paid-${transaction.id}`}
                              />
                              <label className="checkmark" htmlFor={`paid-${transaction.id}`}></label>
                            </div>
                            <div className="expense-content">
                              {editingId === transaction.id ? (
                                // Edit mode
                                <div className="expense-edit-form">
                                  <input
                                    type="text"
                                    value={editingValues.description || ''}
                                    onChange={(e) => setEditingValues({
                                      ...editingValues,
                                      description: e.target.value
                                    })}
                                    className="form-control form-control-sm mb-2"
                                    placeholder="Description"
                                  />
                                  <input
                                    type="number"
                                    value={editingValues.amount || ''}
                                    onChange={(e) => setEditingValues({
                                      ...editingValues,
                                      amount: parseFloat(e.target.value)
                                    })}
                                    className="form-control form-control-sm mb-2"
                                    step="0.01"
                                    placeholder="Amount"
                                  />
                                  <select
                                    value={editingValues.category || ''}
                                    onChange={(e) => setEditingValues({
                                      ...editingValues,
                                      category: e.target.value
                                    })}
                                    className="form-select form-select-sm mb-2"
                                  >
                                    <option value="Bills">Bills</option>
                                    <option value="Savings">Savings</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  <input
                                    type="date"
                                    value={editingValues.dueDate || ''}
                                    onChange={(e) => setEditingValues({
                                      ...editingValues,
                                      dueDate: e.target.value
                                    })}
                                    className="form-control form-control-sm mb-2"
                                  />
                                  <div className="edit-actions">
                                    <button
                                      onClick={() => saveEdit(transaction.id)}
                                      className="btn btn-success btn-sm me-2"
                                    >
                                      <i className="fas fa-save"></i> Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="btn btn-secondary btn-sm"
                                    >
                                      <i className="fas fa-times"></i> Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                // Display mode
                                <>
                                  <div className="expense-primary">
                                    <span className="expense-title">{transaction.description}</span>
                                    <span className="expense-amount">${transaction.amount.toFixed(2)}</span>
                                  </div>
                                  <div className="expense-secondary">
                                    <span className="expense-tag">{transaction.category}</span>
                                    <span className="expense-date">{getDayWithSuffix(transaction.dueDate)}</span>
                                    <span className="expense-frequency">{transaction.frequency}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            {!editingId && (
                              <div className="expense-actions">
                                <button
                                  onClick={() => startEditing(transaction)}
                                  className="btn-icon"
                                  title="Edit"
                                >
                                  <i className="fas fa-edit"></i>
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => deleteTransaction(transaction.id, currentMonth)}
                                  className="btn-icon delete"
                                  title="Delete"
                                >
                                  <i className="fas fa-trash"></i>
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Render current month's page */}
          <MonthPage
            month={currentMonth}
            year={currentYear}
            transactions={allMonthsTransactions[`${currentYear}-${currentMonth}`] || []}
            onUpdateTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        </>
      ) : (
        <CreditCardTracker />
      )}
    </div>
  );
}

export default App;