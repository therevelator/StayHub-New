const RoomForm = ({ onSubmit, initialData = null, isEditing = false }) => {
  // Add prop validation at the start
  if (typeof onSubmit !== 'function') {
    console.error('RoomForm: onSubmit prop must be a function, received:', onSubmit);
  }

  const [formData, setFormData] = useState({
    name: '',
    room_type: 'Standard Room',
    status: 'available',
    beds: [],
    max_occupancy: 1,
    base_price: '',
    cleaning_fee: '',
    service_fee: '',
    tax_rate: '',
    security_deposit: '',
    amenities: [],
    accessibility_features: [],
    energy_saving_features: [],
    ...initialData
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Attempting to submit with onSubmit:', onSubmit);
      
      // Guard clause for missing onSubmit
      if (typeof onSubmit !== 'function') {
        toast.error('Form submission handler not properly configured');
        return;
      }

      const dataToSubmit = {
        ...formData,
        beds: typeof formData.beds === 'string' ? formData.beds : JSON.stringify(formData.beds),
        amenities: typeof formData.amenities === 'string' ? formData.amenities : JSON.stringify(formData.amenities),
        accessibility_features: typeof formData.accessibility_features === 'string' 
          ? formData.accessibility_features 
          : JSON.stringify(formData.accessibility_features),
        energy_saving_features: typeof formData.energy_saving_features === 'string'
          ? formData.energy_saving_features
          : JSON.stringify(formData.energy_saving_features)
      };

      await onSubmit(dataToSubmit);
      
      if (!isEditing) {
        resetForm();
      }
      
      toast.success('Room saved successfully');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to save room');
    }
  };

  // ... rest of your component code ...
};

// Add PropTypes validation
RoomForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isEditing: PropTypes.bool
};

export default RoomForm; 