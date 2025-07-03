import React from 'react';
import Input from './Input.js';
import Textarea from './Textarea.js';
import Button from './Button.js';
import { PlusIcon, TrashIcon, DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FIELD_TYPES } from '../config/fields.js';
import { toast } from 'react-hot-toast';

const DynamicField = ({
  field,
  value,
  onChange,
  onAddItem,
  onRemoveItem,
  onArrayItemChange,
  errors = {}
}) => {
  const { id, label, type, required, placeholder, validation, rows, options, template, minItems = 0, accept, maxSize, description } = field;

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (accept && !file.name.toLowerCase().endsWith(accept.replace('.', ''))) {
        toast.error(`Please select a ${accept} file`);
        return;
      }
      
      // Validate file size
      if (maxSize && file.size > maxSize) {
        toast.error(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
        return;
      }
      
      onChange(id, file);
    }
  };

  const handleRemoveFile = () => {
    onChange(id, null);
  };

  // Handle simple field types
  if (type !== FIELD_TYPES.ARRAY) {
    const commonProps = {
      label: `${label}${required ? ' *' : ''}`,
      value: value || '',
      onChange: (e) => onChange(id, e.target.value),
      placeholder,
      required,
      error: errors[id]
    };

    switch (type) {
      case FIELD_TYPES.FILE:
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {commonProps.label}
            </label>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
            
            {!value ? (
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor={`file-upload-${id}`}
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id={`file-upload-${id}`}
                        name={`file-upload-${id}`}
                        type="file"
                        className="sr-only"
                        accept={accept}
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {accept ? `${accept.toUpperCase()} up to ${Math.round(maxSize / (1024 * 1024))}MB` : 'PDF up to 10MB'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex items-center">
                  <DocumentArrowUpIcon className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{value.name}</p>
                    <p className="text-sm text-gray-500">
                      {value && typeof value.size === 'number'
                        ? (value.size / 1024 / 1024).toFixed(2) + ' MB'
                        : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {errors[id] && (
              <p className="text-sm text-red-600">{errors[id]}</p>
            )}
          </div>
        );

      case FIELD_TYPES.TEXTAREA:
        return (
          <Textarea
            {...commonProps}
            rows={rows || 3}
          />
        );

      case FIELD_TYPES.SELECT:
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {commonProps.label}
            </label>
            <select
              value={commonProps.value}
              onChange={commonProps.onChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors[id] ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select an option</option>
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors[id] && (
              <p className="text-sm text-red-600">{errors[id]}</p>
            )}
          </div>
        );

      default:
        return (
          <Input
            {...commonProps}
            type={type}
          />
        );
    }
  }

  // Handle array field types
  if (type === FIELD_TYPES.ARRAY) {
    const arrayValue = Array.isArray(value) ? value : [];
    const canRemove = arrayValue.length > minItems;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {label}{required ? ' *' : ''}
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddItem(id)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add {label}
          </Button>
        </div>

        {arrayValue.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <p>No {label.toLowerCase()} added yet</p>
            <p className="text-sm">Click "Add {label}" to get started</p>
          </div>
        )}

        {arrayValue.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{label} #{index + 1}</h4>
              {canRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(id, index)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(template).map(([fieldKey, fieldConfig]) => (
                <div key={fieldKey} className={fieldConfig.type === FIELD_TYPES.TEXTAREA ? 'md:col-span-2' : ''}>
                  <DynamicField
                    field={{
                      ...fieldConfig,
                      id: `${id}.${index}.${fieldKey}`,
                      label: fieldConfig.label,
                      required: fieldConfig.required
                    }}
                    value={item[fieldKey] || ''}
                    onChange={(fieldId, value) => onArrayItemChange(id, index, fieldKey, value)}
                    errors={errors}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {errors[id] && (
          <p className="text-sm text-red-600">{errors[id]}</p>
        )}
      </div>
    );
  }

  return null;
};

export default DynamicField; 