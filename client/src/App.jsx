import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function App() {
  // State
  const [stores, setStores] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [formData, setFormData] = useState({
    name: '', street: '', city: '', state: '', zipCode: '', longitude: '', latitude: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchParams, setSearchParams] = useState({ zipcode: '', radius: '' });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stores`);
      const data = await res.json();
      if (data.success) {
        setStores(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const formatError = (data) => {
    if (data.errors && data.errors.length > 0) {
      return data.errors.map(e => e.message).join(', ');
    }
    return data.message || 'An error occurred';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name: formData.name,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
      }
    };

    try {
      const url = editingId ? `${API_BASE}/api/stores/${editingId}` : `${API_BASE}/api/stores`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!data.success) {
        setError(formatError(data));
      } else {
        setSuccessMsg(editingId ? 'Store updated!' : 'Store created!');
        resetForm();
        fetchStores();
      }
    } catch (err) {
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store) => {
    setEditingId(store._id);
    setFormData({
      name: store.name,
      street: store.address.street,
      city: store.address.city,
      state: store.address.state,
      zipCode: store.address.zipCode,
      longitude: store.location.coordinates[0],
      latitude: store.location.coordinates[1]
    });
    setError(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this store?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/stores/${id}`, { method: 'DELETE' });
      if (res.ok) fetchStores();
    } catch (err) {
      alert('Failed to delete store.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearchError(null);
    setNearbyStores([]);
    setSearched(true);

    try {
      const res = await fetch(`${API_BASE}/api/stores/nearby?zipcode=${searchParams.zipcode}&radius=${searchParams.radius}`);
      const data = await res.json();

      if (!data.success) {
        setSearchError(formatError(data));
      } else {
        setNearbyStores(data.data);
      }
    } catch (err) {
      setSearchError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', street: '', city: '', state: '', zipCode: '', longitude: '', latitude: '' });
  };

  return (
    <div className="container">
      <header>
        <h1>Store Locator</h1>
        <p>Find and manage stores by location</p>
      </header>

      <div className="grid">
        <div className="card">
          <h2>{editingId ? 'Edit Store' : 'Create Store'}</h2>
          {error && <div className="error-msg">{error}</div>}
          {successMsg && <div className="success-msg">{successMsg}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input required name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Street</label>
              <input required name="street" value={formData.street} onChange={handleInputChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input required name="city" value={formData.city} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>State (2 letters)</label>
                <input required name="state" value={formData.state} onChange={handleInputChange} maxLength="2" />
              </div>
            </div>
            <div className="form-group">
              <label>ZIP Code</label>
              <input required name="zipCode" value={formData.zipCode} onChange={handleInputChange} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Longitude</label>
                <input required type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Latitude</label>
                <input required type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} />
              </div>
            </div>
            <div className="store-actions">
              <button type="submit" disabled={loading}>{editingId ? 'Update Store' : 'Create Store'}</button>
              {editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Store List</h2>
          <div className="store-list">
            {stores.length === 0 ? (
              <div className="empty-state">No stores found</div>
            ) : (
              stores.map(s => (
                <div key={s._id} className="store-item">
                  <div className="store-header">
                    <h3>{s.name}</h3>
                    <div className="store-actions">
                      <button className="secondary" onClick={() => handleEdit(s)}>Edit</button>
                      <button className="danger" onClick={() => handleDelete(s._id)}>Delete</button>
                    </div>
                  </div>
                  <p className="store-address">
                    {s.address.street}<br/>
                    {s.address.city}, {s.address.state} {s.address.zipCode}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: '2rem' }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>Nearby Store Search</h2>
          <form onSubmit={handleSearch} className="form-row" style={{ alignItems: 'end', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>ZIP Code</label>
              <input required name="zipcode" value={searchParams.zipcode} onChange={handleSearchChange} placeholder="e.g. 10001" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Radius (miles)</label>
              <input required type="number" min="0.1" step="any" name="radius" value={searchParams.radius} onChange={handleSearchChange} placeholder="e.g. 10" />
            </div>
            <button type="submit" disabled={loading}>Find Nearby Stores</button>
          </form>

          {searchError && <div className="error-msg">{searchError}</div>}

          {nearbyStores.length > 0 && (
            <div className="store-list" style={{ maxHeight: 'none' }}>
              {nearbyStores.map(s => (
                <div key={s._id} className="store-item">
                  <div className="store-header">
                    <h3>{s.name}</h3>
                  </div>
                  <p className="store-address">
                    {s.address.street}<br/>
                    {s.address.city}, {s.address.state} {s.address.zipCode}
                  </p>
                  <span className="distance">{s.distance} miles away</span>
                </div>
              ))}
            </div>
          )}
          {nearbyStores.length === 0 && !searchError && searched && !loading && (
             <div className="empty-state">No stores found within this radius</div>
          )}
          {!searched && (
             <div className="empty-state">Enter a ZIP code and radius to search</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
