import React, { useState } from 'react';
import { Card } from 'react-bootstrap';
import CreditCardGraph from './CreditCardGraph';

const CreditCardTracker = ({ creditCards, setCreditCards }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [newCard, setNewCard] = useState({
    name: '',
    balance: '',
    interestRate: '',
    minPayment: ''
  });
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const savedBudget = localStorage.getItem('creditCardBudget');
    return savedBudget || ''; // Return empty string if no saved budget
  });
  const [payoffStrategy, setPayoffStrategy] = useState('snowball');
  const [showGraph, setShowGraph] = useState(true);
  const [editingCard, setEditingCard] = useState(null);

  const handleAddCard = (e) => {
    e.preventDefault();
    if (!newCard.name || !newCard.balance || !newCard.minPayment) {
      return;
    }

    const card = {
      id: Date.now(),
      ...newCard,
      balance: parseFloat(newCard.balance),
      interestRate: newCard.interestRate ? parseFloat(newCard.interestRate) : 0,
      minPayment: parseFloat(newCard.minPayment)
    };
    
    setCreditCards([...creditCards, card]);
    setNewCard({ name: '', balance: '', interestRate: '', minPayment: '' });
  };

  const handleDeleteCard = (id) => {
    setCreditCards(creditCards.filter(card => card.id !== id));
  };

  const handleEditCard = (card) => {
    setEditingCard({
      ...card,
      balance: card.balance.toString(),
      interestRate: card.interestRate.toString(),
      minPayment: card.minPayment.toString()
    });
  };

  const handleSaveEdit = () => {
    setCreditCards(creditCards.map(card => 
      card.id === editingCard.id ? {
        ...editingCard,
        balance: parseFloat(editingCard.balance),
        interestRate: parseFloat(editingCard.interestRate),
        minPayment: parseFloat(editingCard.minPayment)
      } : card
    ));
    setEditingCard(null);
  };

  const calculatePayoffPlan = () => {
    if (!monthlyBudget || creditCards.length === 0) return null;

    // Sort cards by balance (snowball method)
    const sortedCards = [...creditCards].sort((a, b) => a.balance - b.balance);
    let remainingBudget = parseFloat(monthlyBudget);
    
    return sortedCards.map(card => {
      const payment = Math.min(remainingBudget, card.balance);
      remainingBudget -= card.minPayment;
      const monthsToPayoff = Math.ceil(card.balance / payment);
      const totalInterest = card.interestRate 
        ? (card.balance * (card.interestRate / 100) * monthsToPayoff) / 12 
        : 0;

      return {
        ...card,
        payment,
        monthsToPayoff,
        totalInterest
      };
    });
  };

  const payoffPlan = calculatePayoffPlan();

  // Only handle budget localStorage
  const handleSaveBudget = () => {
    if (monthlyBudget) {
      localStorage.setItem('creditCardBudget', monthlyBudget);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Debt Tracker</h3>
        </div>
      </Card.Header>
      <Card.Body>
        {/* Add Card Form */}
        <form onSubmit={handleAddCard} className="mb-4">
          <div className="row g-2">
            <div className="col-12 col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Account Name (Card/Loan)"
                value={newCard.name}
                onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                required
              />
            </div>
            <div className="col-6 col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Current Balance"
                value={newCard.balance}
                onChange={(e) => setNewCard({...newCard, balance: e.target.value})}
                required
                step="0.01"
              />
            </div>
            <div className="col-6 col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Interest % (optional)"
                value={newCard.interestRate}
                onChange={(e) => setNewCard({...newCard, interestRate: e.target.value})}
                step="0.01"
              />
            </div>
            <div className="col-6 col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Min Monthly Payment"
                value={newCard.minPayment}
                onChange={(e) => setNewCard({...newCard, minPayment: e.target.value})}
                required
                step="0.01"
              />
            </div>
            <div className="col-6 col-md-2">
              <button type="submit" className="btn btn-primary w-100 h-100">Add</button>
            </div>
          </div>
        </form>

        {/* Monthly Budget Input with Label */}
        <div className="mb-4">
          <label htmlFor="monthlyBudget" className="form-label">
            Monthly Budget for Debt Payment
          </label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              id="monthlyBudget"
              type="number"
              className="form-control"
              placeholder="Enter your monthly budget"
              value={monthlyBudget}
              onChange={(e) => {
                const newValue = e.target.value;
                setMonthlyBudget(newValue);
              }}
              step="0.01"
            />
            <button 
              className="btn btn-outline-primary"
              type="button"
              onClick={() => {
                localStorage.setItem('creditCardBudget', monthlyBudget);
              }}
            >
              Save Budget
            </button>
          </div>
        </div>

        {/* Cards List */}
        {creditCards.length > 0 && (
          <div className="table-responsive mb-4">
            <table className="table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Balance</th>
                  <th>Interest Rate</th>
                  <th>Min Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {creditCards.map(card => (
                  <tr key={card.id}>
                    {editingCard?.id === card.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={editingCard.name}
                            onChange={(e) => setEditingCard({...editingCard, name: e.target.value})}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editingCard.balance}
                            onChange={(e) => setEditingCard({...editingCard, balance: e.target.value})}
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editingCard.interestRate}
                            onChange={(e) => setEditingCard({...editingCard, interestRate: e.target.value})}
                            step="0.01"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={editingCard.minPayment}
                            onChange={(e) => setEditingCard({...editingCard, minPayment: e.target.value})}
                            step="0.01"
                          />
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="btn-icon"
                              title="Save changes"
                            >
                              <i className="fas fa-save"></i>
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditingCard(null)}
                              className="btn-icon delete"
                              title="Cancel editing"
                            >
                              <i className="fas fa-times"></i>
                              <span>Cancel</span>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{card.name}</td>
                        <td>${card.balance.toFixed(2)}</td>
                        <td>{card.interestRate}%</td>
                        <td>${card.minPayment.toFixed(2)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              onClick={() => handleEditCard(card)}
                              className="btn-icon"
                              title="Edit card"
                            >
                              <i className="fas fa-edit"></i>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="btn-icon delete"
                              title="Delete card"
                            >
                              <i className="fas fa-trash"></i>
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payoff Plan */}
        {payoffPlan && (
          <div className="payoff-plan">
            <h4>Debt Payoff Plan</h4>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Card</th>
                    <th>Monthly Payment</th>
                    <th>Months to Payoff</th>
                    <th>Total Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {payoffPlan.map(card => (
                    <tr key={card.id}>
                      <td>{card.name}</td>
                      <td>${card.payment.toFixed(2)}</td>
                      <td>{card.monthsToPayoff}</td>
                      <td>${card.totalInterest.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {creditCards.length > 0 && (
          <div className="payoff-analysis">
            <div className="strategy-controls">
              <h4 className="mb-0">Payoff Analysis</h4>
              <select
                value={payoffStrategy}
                onChange={(e) => setPayoffStrategy(e.target.value)}
                className="form-select strategy-select"
              >
                <option value="snowball">Debt Snowball (Lowest Balance First)</option>
                <option value="avalanche">Debt Avalanche (Highest Interest First)</option>
              </select>
            </div>
            
            <CreditCardGraph 
              cards={creditCards}
              monthlyBudget={monthlyBudget}
              strategy={payoffStrategy}
            />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CreditCardTracker; 