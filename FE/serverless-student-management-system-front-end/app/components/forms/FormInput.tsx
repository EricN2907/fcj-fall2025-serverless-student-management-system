interface FormInputProps {
  id?: string
  name: string
  label: string
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select'
  value: any
  onChange: (value: any) => void
  error?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  options?: { value: string; label: string }[]
  rows?: number
  min?: number
  max?: number
}

export default function FormInput({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  options = [],
  rows = 4,
  min,
  max
}: FormInputProps) {
  const inputId = id || name

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={inputId}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            className="form-textarea"
          />
        )
      
      case 'select':
        return (
          <select
            id={inputId}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className="form-select"
          >
            <option value="">Chọn...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      default:
        return (
          <input
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            className="form-input"
          />
        )
    }
  }

  return (
    <div className="form-input-component">
      <label htmlFor={inputId} className="form-label">
        {label}
        {required && <span className="required-mark">*</span>}
      </label>
      {renderInput()}
      {error && <div className="form-error">{error}</div>}
    </div>
  )
}
