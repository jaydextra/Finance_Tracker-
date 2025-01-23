/* eslint-disable no-unused-vars */
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

// Add this before the App component.
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
  const [creditCards, setCreditCards] = useState([]);
  const [customCategory, setCustomCategory] = useState('');
  const [isExpenseListOpen, setIsExpenseListOpen] = useState(true);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Load transactions from localStorage on component mount
  useEffect(() => {
    // Load all data on mount
    const loadData = () => {
      try {
        const savedTransactions = localStorage.getItem('transactions');
        const savedMonthsTransactions = localStorage.getItem('allMonthsTransactions');
        const savedCreditCards = localStorage.getItem('creditCards');

        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
        if (savedMonthsTransactions) {
          setAllMonthsTransactions(JSON.parse(savedMonthsTransactions));
        }
        if (savedCreditCards) {
          setCreditCards(JSON.parse(savedCreditCards));
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []); // Only run on mount

  // Clean up chart on component unmount
  useEffect(() => {
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [chart]);

  // Update the chart useEffect
  useEffect(() => {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;

    // Create a flag to track if the component is mounted
    let isMounted = true;

    try {
      // Get transactions for current month from both sources
      const monthKey = `${currentYear}-${currentMonth}`;
      const monthTransactions = allMonthsTransactions[monthKey] || [];
      const regularTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear;
      });

      // Combine transactions and filter out skipped ones
      const allTransactions = [...regularTransactions, ...monthTransactions]
        .filter(t => t.type === 'expense' && !t.skipped);

      // Calculate totals by category
      const categoryTotals = allTransactions.reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = 0;
        }
        acc[transaction.category] += parseFloat(transaction.amount);
        return acc;
      }, {});

      // Only proceed if we have data and component is mounted
      if (Object.keys(categoryTotals).length > 0 && isMounted) {
        const chartConfig = {
          type: 'pie',
          data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
              data: Object.values(categoryTotals),
              backgroundColor: Object.keys(categoryTotals).map(category => 
                category === 'Bills' ? 'rgba(255, 99, 132, 0.8)' :
                category === 'Savings' ? 'rgba(54, 162, 235, 0.8)' :
                category === 'Personal' ? 'rgba(255, 206, 86, 0.8)' :
                'rgba(255, 206, 86, 0.8)'
              ),
              borderColor: Object.keys(categoryTotals).map(category => 
                category === 'Bills' ? 'rgba(255, 99, 132, 1)' :
                category === 'Savings' ? 'rgba(54, 162, 235, 1)' :
                category === 'Personal' ? 'rgba(255, 206, 86, 1)' :
                'rgba(255, 206, 86, 1)'
              ),
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 500 // Reduce animation duration
            },
            plugins: {
              datalabels: {
                formatter: (value) => `$${value.toFixed(2)}`,
                color: '#fff',
                font: {
                  weight: 'bold',
                  size: 14
                },
                textAlign: 'center'
              },
              legend: {
                position: 'right',
                labels: {
                  color: isDarkMode ? '#ffffff' : '#666666',
                  font: {
                    size: 12
                  },
                  generateLabels: (chart) => {
                    const data = chart.data;
                    if (data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const value = data.datasets[0].data[i];
                        return {
                          text: `${label}: $${value.toFixed(2)}`,
                          fillStyle: data.datasets[0].backgroundColor[i],
                          strokeStyle: data.datasets[0].borderColor[i],
                          lineWidth: 1,
                          hidden: false,
                          index: i
                        };
                      });
                    }
                    return [];
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw;
                    return ` $${value.toFixed(2)}`;
                  }
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        };

        // Update existing chart if it exists, create new one if it doesn't
        if (chart && isMounted) {
          try {
            chart.data = chartConfig.data;
            chart.options = chartConfig.options;
            chart.update('none'); // Update without animation
          } catch (error) {
            console.error('Error updating chart:', error);
            // If update fails, destroy and recreate
            chart.destroy();
            if (isMounted) {
              const newChart = new Chart(ctx, chartConfig);
              setChart(newChart);
            }
          }
        } else if (isMounted) {
          const newChart = new Chart(ctx, chartConfig);
          setChart(newChart);
        }
      }
    } catch (error) {
      console.error('Error in chart effect:', error);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (chart) {
        try {
          chart.destroy();
        } catch (error) {
          console.error('Error destroying chart:', error);
        }
      }
    };
  }, [currentMonth, currentYear, transactions, allMonthsTransactions, isDarkMode, chart]);

  // Separate submit handlers for income and expenses
  const handleIncomeSubmit = (e) => {
    e.preventDefault();
    if (!incomeDescription || !incomeAmount) {
      return; // Just return if validation fails
    }

    const newIncome = {
      id: Date.now(),
      description: incomeDescription,
      amount: parseFloat(incomeAmount),
      type: 'income',
      date: new Date().toISOString(),
      frequency: 'Monthly',
      dueDate: new Date().toISOString().split('T')[0]
    };

    // Use addTransaction instead of directly updating transactions
    addTransaction(newIncome, 'income');
    
    // Clear form
    setIncomeDescription('');
    setIncomeAmount('');
    setIsIncomeOpen(false); // Automatically close the form after submission
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseDescription || !expenseAmount || !dueDate || !category) {
      return;
    }

    // Use custom category if "Other" is selected
    const finalCategory = category === 'Other' ? customCategory : category;

    const newExpense = {
      id: Date.now(),
      description: expenseDescription,
      amount: parseFloat(expenseAmount),
      type: 'expense',
      category: finalCategory,
      dueDate,
      frequency,
      paid: false,
      skipped: false,
      date: new Date().toISOString()
    };

    addTransaction(newExpense, 'expense');
    
    // Clear form
    setExpenseDescription('');
    setExpenseAmount('');
    setCategory('Bills'); // Reset to default category
    setCustomCategory(''); // Clear custom category
    setIsExpenseOpen(false);
  };

  const togglePaid = (id) => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const monthTransactions = allMonthsTransactions[monthKey] || [];
    const monthTransaction = monthTransactions.find(t => t.id === id);

    try {
      if (monthTransaction) {
        setAllMonthsTransactions(prev => {
          const updated = {
            ...prev,
            [monthKey]: prev[monthKey].map(t =>
              t.id === id ? { ...t, paid: !t.paid, skipped: false } : t
            )
          };
          localStorage.setItem('allMonthsTransactions', JSON.stringify(updated));
          return updated;
        });
      } else {
        setTransactions(prev => {
          const updated = prev.map(t =>
            t.id === id ? { ...t, paid: !t.paid, skipped: false } : t
          );
          localStorage.setItem('transactions', JSON.stringify(updated));
          return updated;
        });
      }

      // If chart exists, update it safely
      if (chart) {
        requestAnimationFrame(() => {
          try {
            chart.update('none');
          } catch (error) {
            console.error('Error updating chart in togglePaid:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error in togglePaid:', error);
    }
  };

  const toggleSkipped = (id) => {
    setTransactions(prev => {
      const updated = prev.map(t => 
        t.id === id ? { ...t, skipped: !t.skipped, paid: false } : t
      );
      localStorage.setItem('transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTransaction = (transactionId, fromMonth) => {
    if (window.confirm('Delete this transaction?')) {
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        const monthKey = `${currentYear}-${fromMonth}`;
        const monthTransactions = allMonthsTransactions[monthKey] || [];
        const monthTransaction = monthTransactions.find(t => t.id === transactionId);
        
        if (monthTransaction?.originalTransactionId) {
          const deleteAll = window.confirm(
            'Delete all future occurrences of this recurring transaction?'
          );
          
          if (deleteAll) {
            const updatedMonthsTransactions = { ...allMonthsTransactions };
            Object.keys(updatedMonthsTransactions).forEach(monthKey => {
              const [year, month] = monthKey.split('-').map(Number);
              if (year > currentYear || (year === currentYear && month >= fromMonth)) {
                updatedMonthsTransactions[monthKey] = updatedMonthsTransactions[monthKey]
                  .filter(t => t.originalTransactionId !== monthTransaction.originalTransactionId);
              }
            });
            setAllMonthsTransactions(updatedMonthsTransactions);
            localStorage.setItem('allMonthsTransactions', JSON.stringify(updatedMonthsTransactions));
          } else {
            const updatedMonthsTransactions = {
              ...allMonthsTransactions,
              [monthKey]: allMonthsTransactions[monthKey].filter(t => t.id !== transactionId)
            };
            setAllMonthsTransactions(updatedMonthsTransactions);
            localStorage.setItem('allMonthsTransactions', JSON.stringify(updatedMonthsTransactions));
          }
        } else {
          const updatedMonthsTransactions = {
            ...allMonthsTransactions,
            [monthKey]: allMonthsTransactions[monthKey].filter(t => t.id !== transactionId)
          };
          setAllMonthsTransactions(updatedMonthsTransactions);
          localStorage.setItem('allMonthsTransactions', JSON.stringify(updatedMonthsTransactions));
        }
      } else {
        const updatedTransactions = transactions.filter(t => t.id !== transactionId);
        setTransactions(updatedTransactions);
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
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

  // Add these wrapper functions
  const updateTransactions = (newTransactions) => {
    setTransactions(newTransactions);
    localStorage.setItem('transactions', JSON.stringify(newTransactions));
  };

  const updateMonthlyTransactions = (newMonthlyTransactions) => {
    setAllMonthsTransactions(newMonthlyTransactions);
    localStorage.setItem('allMonthsTransactions', JSON.stringify(newMonthlyTransactions));
  };

  // Update the addTransaction function
  const addTransaction = (transaction, type) => {
    const endOfYear = new Date(currentYear, 11, 31);
    const isRecurring = transaction.frequency !== 'One-time';
    const startDate = new Date(transaction.dueDate);

    // Ensure paid property is set for expenses
    const transactionWithPaid = {
      ...transaction,
      paid: type === 'expense' ? false : undefined
    };

    if (isRecurring) {
      const recurringDates = generateRecurringDates(
        startDate,
        transaction.frequency,
        endOfYear
      );

      const transactionsByMonth = {};
      recurringDates.forEach(date => {
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (!transactionsByMonth[monthKey]) {
          transactionsByMonth[monthKey] = [];
        }

        const recurringTransaction = {
          ...transactionWithPaid,
          id: Date.now() + Math.random(),
          dueDate: date.toISOString().split('T')[0],
          originalTransactionId: transaction.id,
          paid: type === 'expense' ? false : undefined
        };

        transactionsByMonth[monthKey].push(recurringTransaction);
      });

      // Update allMonthsTransactions
      const updatedMonthsTransactions = { ...allMonthsTransactions };
      Object.entries(transactionsByMonth).forEach(([monthKey, transactions]) => {
        if (!updatedMonthsTransactions[monthKey]) {
          updatedMonthsTransactions[monthKey] = [];
        }
        updatedMonthsTransactions[monthKey] = [
          ...updatedMonthsTransactions[monthKey],
          ...transactions
        ];
      });

      setAllMonthsTransactions(updatedMonthsTransactions);
      localStorage.setItem('allMonthsTransactions', JSON.stringify(updatedMonthsTransactions));

    } else {
      if (type === 'income') {
        updateTransactions([...transactions, transactionWithPaid]);
      } else {
        // Handle one-time expenses
        const transactionDate = new Date(transaction.dueDate);
        const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;
        
        const updatedMonthly = {
          ...allMonthsTransactions,
          [monthKey]: [
            ...(allMonthsTransactions[monthKey] || []),
            { ...transactionWithPaid, paid: false }
          ]
        };

        updateMonthlyTransactions(updatedMonthly);
      }
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

  // Add this function near the top of App component
  const updateCreditCards = (newCards) => {
    setCreditCards(newCards);
    localStorage.setItem('creditCards', JSON.stringify(newCards));
  };

  // Add function to calculate payment summary
  const calculatePaymentSummary = () => {
    const expenses = filterTransactions('expense');
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    const paid = expenses.reduce((sum, t) => t.paid ? sum + t.amount : sum, 0);
    const remaining = total - paid;
    
    return {
      total: total.toFixed(2),
      paid: paid.toFixed(2),
      remaining: remaining.toFixed(2),
      progress: total > 0 ? (paid / total * 100).toFixed(1) : 0
    };
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
                          <option value="Other">Other...</option>
                        </select>
                        {/* Show custom category input when "Other" is selected */}
                        {category === 'Other' && (
                          <input
                            type="text"
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="Enter custom category"
                            className="form-control mt-2"
                            required
                          />
                        )}
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
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Amount</th>
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
                  <div className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-0">Expenses List</h3>
                    <button 
                      className="btn btn-link text-white" 
                      onClick={() => setIsExpenseListOpen(!isExpenseListOpen)}
                    >
                      <i className={`fas fa-chevron-${isExpenseListOpen ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                </div>
                
                {/* Payment Summary Section */}
                <div className="card-body pb-0">
                  <div className="payment-summary mb-3">
                    {(() => {
                      const summary = calculatePaymentSummary();
                      return (
                        <>
                          <div className="progress mb-2">
                            <div 
                              className="progress-bar bg-success" 
                              role="progressbar" 
                              style={{width: `${summary.progress}%`}}
                              aria-valuenow={summary.progress} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            >
                              {summary.progress}%
                            </div>
                          </div>
                          <div className="summary-grid">
                            <div className="summary-item">
                              <span className="label">Total Expenses:</span>
                              <span className="value">${summary.total}</span>
                            </div>
                            <div className="summary-item">
                              <span className="label">Paid:</span>
                              <span className="value text-success">${summary.paid}</span>
                            </div>
                            <div className="summary-item">
                              <span className="label">Remaining:</span>
                              <span className="value text-danger">${summary.remaining}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Collapse in={isExpenseListOpen}>
                  <div>
                    <div className="card-body">
                      <div className="table-responsive">
                        {/* Existing expense list code */}
                        <div className="expense-list">
                          {filterTransactions('expense').map(transaction => (
                            <div key={transaction.id} className={`expense-item ${transaction.paid ? 'paid' : ''}`}>
                              <div className="expense-main">
                                <div className="expense-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={transaction.paid || false}
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
                                        {transaction.type === 'expense' && (
                                          <span className="expense-tag">{transaction.category}</span>
                                        )}
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
                </Collapse>
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
        <CreditCardTracker 
          creditCards={creditCards} 
          setCreditCards={updateCreditCards}
        />
      )}
    </div>
  );
}

export default App;