import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BasicInfoForm from '../../pages/ListProperty/steps/BasicInfoForm';
import LocationForm from '../../pages/ListProperty/steps/LocationForm';
import AmenitiesForm from '../../pages/ListProperty/steps/AmenitiesForm';
import PhotosForm from '../../pages/ListProperty/steps/PhotosForm';
import RulesForm from '../../pages/ListProperty/steps/RulesForm';
import { CheckCircleIcon } from '@heroicons/react/20/solid';

const steps = [
  { id: 'basic-info', title: 'Basic Information', component: BasicInfoForm },
  { id: 'location', title: 'Location', component: LocationForm },
  { id: 'amenities', title: 'Amenities', component: AmenitiesForm },
  { id: 'photos', title: 'Photos', component: PhotosForm },
  { id: 'rules', title: 'Rules & Policies', component: RulesForm }
];

const CreatePropertyWizard = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [completed, setCompleted] = useState({});

  const handleNext = () => {
    const newCompleted = { ...completed };
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const handleStepChange = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    try {
      // Submit logic here
      navigate('/properties');
    } catch (error) {
      console.error('Error creating property:', error);
    }
  };

  const CurrentStepComponent = steps[activeStep].component;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-8">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = completed[index];

            return (
              <li key={step.id} className={`flex items-center ${index !== 0 ? 'ml-8' : ''}`}>
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={!isCompleted && index > activeStep}
                  className={`flex items-center ${
                    isActive
                      ? 'text-primary-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full border-2 
                    ${isActive
                      ? 'border-primary-600 bg-primary-50'
                      : isCompleted
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </span>
                  <span className="ml-2 text-sm font-medium">
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className="ml-4 flex-1 border-t-2 border-gray-200" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <CurrentStepComponent
          data={formData}
          onChange={handleStepChange}
        />
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          disabled={activeStep === 0}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            activeStep === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Back
        </button>
        
        {activeStep === steps.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create Property
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default CreatePropertyWizard;
