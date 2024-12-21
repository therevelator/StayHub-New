import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { CurrencyDollarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const PricingForm = ({ onSubmit, initialValues = {} }) => {
  const formik = useFormik({
    initialValues: {
      basePrice: initialValues.basePrice || '',
      cleaningFee: initialValues.cleaningFee || '',
      serviceFee: initialValues.serviceFee || '',
      taxRate: initialValues.taxRate || '',
      minimumStay: initialValues.minimumStay || 1,
      maximumStay: initialValues.maximumStay || 30,
      cancellationPolicy: initialValues.cancellationPolicy || 'flexible'
    },
    validationSchema: Yup.object({
      basePrice: Yup.number()
        .min(0, 'Base price cannot be negative')
        .required('Base price is required'),
      cleaningFee: Yup.number()
        .min(0, 'Cleaning fee cannot be negative')
        .required('Cleaning fee is required'),
      serviceFee: Yup.number()
        .min(0, 'Service fee cannot be negative')
        .required('Service fee is required'),
      taxRate: Yup.number()
        .min(0, 'Tax rate cannot be negative')
        .max(100, 'Tax rate cannot exceed 100%')
        .required('Tax rate is required'),
      minimumStay: Yup.number()
        .min(1, 'Minimum stay must be at least 1 night')
        .required('Minimum stay is required'),
      maximumStay: Yup.number()
        .min(Yup.ref('minimumStay'), 'Maximum stay must be greater than minimum stay')
        .required('Maximum stay is required'),
      cancellationPolicy: Yup.string().required('Cancellation policy is required')
    }),
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  const cancellationPolicies = [
    {
      value: 'flexible',
      label: 'Flexible',
      description: 'Full refund 1 day prior to arrival'
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: 'Full refund 5 days prior to arrival'
    },
    {
      value: 'strict',
      label: 'Strict',
      description: 'Full refund 14 days prior to arrival'
    }
  ];

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pricing Details</h2>
        <p className="mt-1 text-sm text-gray-600">
          Set your property's pricing and policies
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Base Price per Night
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="basePrice"
              {...formik.getFieldProps('basePrice')}
              className={`block w-full pl-10 rounded-md shadow-sm ${
                formik.touched.basePrice && formik.errors.basePrice
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
            />
          </div>
          {formik.touched.basePrice && formik.errors.basePrice && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.basePrice}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cleaning Fee
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="cleaningFee"
              {...formik.getFieldProps('cleaningFee')}
              className={`block w-full pl-10 rounded-md shadow-sm ${
                formik.touched.cleaningFee && formik.errors.cleaningFee
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
            />
          </div>
          {formik.touched.cleaningFee && formik.errors.cleaningFee && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.cleaningFee}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Service Fee
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="serviceFee"
              {...formik.getFieldProps('serviceFee')}
              className={`block w-full pl-10 rounded-md shadow-sm ${
                formik.touched.serviceFee && formik.errors.serviceFee
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
            />
          </div>
          {formik.touched.serviceFee && formik.errors.serviceFee && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.serviceFee}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tax Rate (%)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              name="taxRate"
              {...formik.getFieldProps('taxRate')}
              className={`block w-full rounded-md shadow-sm ${
                formik.touched.taxRate && formik.errors.taxRate
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
          {formik.touched.taxRate && formik.errors.taxRate && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.taxRate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Minimum Stay (nights)
          </label>
          <input
            type="number"
            name="minimumStay"
            {...formik.getFieldProps('minimumStay')}
            min="1"
            className={`mt-1 block w-full rounded-md shadow-sm ${
              formik.touched.minimumStay && formik.errors.minimumStay
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }`}
          />
          {formik.touched.minimumStay && formik.errors.minimumStay && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.minimumStay}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Maximum Stay (nights)
          </label>
          <input
            type="number"
            name="maximumStay"
            {...formik.getFieldProps('maximumStay')}
            min="1"
            className={`mt-1 block w-full rounded-md shadow-sm ${
              formik.touched.maximumStay && formik.errors.maximumStay
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
            }`}
          />
          {formik.touched.maximumStay && formik.errors.maximumStay && (
            <p className="mt-1 text-sm text-red-600">{formik.errors.maximumStay}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Cancellation Policy
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          {cancellationPolicies.map((policy) => (
            <div
              key={policy.value}
              className={`relative rounded-lg border p-4 cursor-pointer ${
                formik.values.cancellationPolicy === policy.value
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => formik.setFieldValue('cancellationPolicy', policy.value)}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-900">
                    {policy.label}
                  </div>
                  {formik.values.cancellationPolicy === policy.value && (
                    <div className="h-5 w-5 text-primary-600">
                      <InformationCircleIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{policy.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => formik.resetForm()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Reset
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Save and Continue
        </button>
      </div>
    </form>
  );
};

export default PricingForm;
