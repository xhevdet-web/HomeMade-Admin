import PropTypes from 'prop-types'
import { CAlert, CButton, CCol, CFormCheck, CFormInput, CFormLabel, CRow } from '@coreui/react'
import { legacyApparelOptions } from './catalogFields'

const optionOf = (options, key) => options.find((option) => option.key === key)

const SelectValuesEditor = ({ title, values, onChange }) => {
  const add = () => onChange([...values, ''])
  return (
    <section className="border rounded p-3 mb-3">
      <h4>{title}</h4>
      {values.map((value, index) => (
        <div className="d-flex gap-2 mb-2" key={index}>
          <CFormInput
            aria-label={`${title} ${index + 1}`}
            value={value}
            onChange={(event) =>
              onChange(values.map((item, row) => (row === index ? event.target.value : item)))
            }
          />
          <CButton
            type="button"
            color="danger"
            variant="outline"
            aria-label={`Delete value ${index + 1} from ${title}`}
            onClick={() => onChange(values.filter((_, row) => row !== index))}
          >
            Remove
          </CButton>
        </div>
      ))}
      <CButton type="button" color="primary" variant="outline" onClick={add}>
        + Add {title === 'Apparel Sizes' ? 'Size' : 'Value'}
      </CButton>
    </section>
  )
}

const ColorValuesEditor = ({ title, values, onChange }) => {
  const change = (index, key, value) =>
    onChange(values.map((color, row) => (row === index ? { ...color, [key]: value } : color)))
  return (
    <section className="border rounded p-3 mb-3">
      <h4>{title}</h4>
      {values.map((color, index) => (
        <CRow className="g-2 align-items-end mb-2" key={index}>
          <CCol xs={12} md={5}>
            <CFormLabel htmlFor={`color-${title}-${index}-name`}>Name</CFormLabel>
            <CFormInput
              id={`color-${title}-${index}-name`}
              aria-label={`${title} ${index + 1} Name`}
              value={color.name}
              onChange={(event) => change(index, 'name', event.target.value)}
            />
          </CCol>
          <CCol xs={4} md={2}>
            <CFormLabel htmlFor={`color-${title}-${index}-picker`}>Picker</CFormLabel>
            <CFormInput
              id={`color-${title}-${index}-picker`}
              type="color"
              aria-label={`${title} ${index + 1} Picker`}
              value={/^#[0-9a-f]{6}$/i.test(color.value) ? color.value : '#000000'}
              onChange={(event) => change(index, 'value', event.target.value.toUpperCase())}
            />
          </CCol>
          <CCol xs={8} md={3}>
            <CFormLabel htmlFor={`color-${title}-${index}-value`}>Color value</CFormLabel>
            <CFormInput
              id={`color-${title}-${index}-value`}
              aria-label={`${title} ${index + 1} Color value`}
              value={color.value}
              onChange={(event) => change(index, 'value', event.target.value)}
            />
          </CCol>
          <CCol xs={12} md={2}>
            <CButton
              type="button"
              color="danger"
              variant="outline"
              className="w-100"
              aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
              onClick={() => onChange(values.filter((_, row) => row !== index))}
            >
              Remove
            </CButton>
          </CCol>
        </CRow>
      ))}
      <CButton
        type="button"
        color="primary"
        variant="outline"
        onClick={() => onChange([...values, { name: '', value: '#000000' }])}
      >
        + Add Color
      </CButton>
    </section>
  )
}

const Toggle = ({ id, label, checked, onChange }) => (
  <CFormCheck id={id} label={label} checked={checked} onChange={(event) => onChange(event.target.checked)} />
)

const CategoryOptionsEditor = ({ builderType, options, onChange }) => {
  const setOption = (key, next) =>
    onChange(
      options.some((option) => option.key === key)
        ? options.map((option) => (option.key === key ? next : option))
        : [...options, next],
    )
  const removeOption = (key) => onChange(options.filter((option) => option.key !== key))
  const select = (key, name, title) => {
    const option = optionOf(options, key) || { key, name, type: 'select', required: true, values: [] }
    return (
      <SelectValuesEditor
        title={title}
        values={option.values || []}
        onChange={(values) => setOption(key, { ...option, values })}
      />
    )
  }
  const colors = (key, name, title, defaultRequired = false) => {
    const option = optionOf(options, key)
    return (
      <>
        {builderType !== 'APPAREL' && (
          <div className="d-flex flex-wrap gap-4 mb-3">
            <Toggle
              id={`${key}-enabled`}
              label={`${title} enabled`}
              checked={!!option}
              onChange={(enabled) =>
                enabled
                  ? setOption(key, { key, name, type: 'color', required: defaultRequired, values: [] })
                  : removeOption(key)
              }
            />
            {option && (
              <Toggle
                id={`${key}-required`}
                label="Required"
                checked={option.required}
                onChange={(required) => setOption(key, { ...option, required })}
              />
            )}
          </div>
        )}
        {(option || builderType === 'APPAREL') && (
          <ColorValuesEditor
            title={title}
            values={option?.values || []}
            onChange={(values) =>
              setOption(key, option ? { ...option, values } : { key, name, type: 'color', required: true, values })
            }
          />
        )}
      </>
    )
  }

  const textOption = (key, name, title, defaultLength) => {
    const text = optionOf(options, key)
    return (
      <section className="border rounded p-3 mb-3">
        <h4>{title}</h4>
        <div className="d-flex flex-wrap gap-4 mb-3">
          <Toggle id={`${key}-enabled`} label="Enabled" checked={!!text} onChange={(enabled) => enabled ? setOption(key, { key, name, type: 'text', required: false, maxLength: defaultLength }) : removeOption(key)} />
          {text && <Toggle id={`${key}-required`} label="Required" checked={text.required} onChange={(required) => setOption(key, { ...text, required })} />}
        </div>
        {text && (
          <>
            <CFormLabel htmlFor={`${key}-max-length`}>Maximum length</CFormLabel>
            <CFormInput id={`${key}-max-length`} type="number" min="1" max="10000" step="1" value={text.maxLength ?? ''} onChange={(event) => setOption(key, { ...text, maxLength: event.target.value })} />
          </>
        )}
      </section>
    )
  }

  if (builderType === 'APPAREL') {
    const legacy = legacyApparelOptions(options)
    return (
      <section className="mt-4" aria-label="Category options">
        <h3>Extra options</h3>
        <p className="hm-muted">
          Sizes and colours are set per garment on the Garments tab. Options here are only for
          extras such as a gift message.
        </p>
        {legacy.length > 0 && (
          <CAlert color="warning" role="alert">
            <strong>This category still has {legacy.map((option) => option.name.toLowerCase()).join(' and ')} options.</strong>{' '}
            Size and colour now come from each garment&apos;s variants and are ignored here.
            <div className="mt-2">
              <CButton
                type="button"
                color="warning"
                size="sm"
                onClick={() => onChange(options.filter((option) => !legacy.includes(option)))}
              >
                Remove size and colour options
              </CButton>
            </div>
          </CAlert>
        )}
        {textOption('giftMessage', 'Gift Message', 'Gift Message', 200)}
      </section>
    )
  }
  if (builderType === 'BOUQUET') {
    const count = optionOf(options, 'flowerCount')
    return (
      <section className="mt-4" aria-label="Category options">
        <h3>Options</h3>
        {select('bouquetSize', 'Bouquet Size', 'Bouquet Sizes')}
        <section className="border rounded p-3 mb-3">
          <h4>Flower Count</h4>
          <div className="d-flex flex-wrap gap-4 mb-3">
            <Toggle
              id="flower-count-enabled"
              label="Enabled"
              checked={!!count}
              onChange={(enabled) =>
                enabled
                  ? setOption('flowerCount', { key: 'flowerCount', name: 'Number of Flowers', type: 'number', required: false, min: '', max: '' })
                  : removeOption('flowerCount')
              }
            />
            {count && <Toggle id="flower-count-required" label="Required" checked={count.required} onChange={(required) => setOption('flowerCount', { ...count, required })} />}
          </div>
          {count && (
            <CRow className="g-3">
              {['min', 'max'].map((key) => (
                <CCol md={6} key={key}>
                  <CFormLabel htmlFor={`flower-count-${key}`}>{key === 'min' ? 'Minimum' : 'Maximum'}</CFormLabel>
                  <CFormInput id={`flower-count-${key}`} type="number" value={count[key] ?? ''} onChange={(event) => setOption('flowerCount', { ...count, [key]: event.target.value })} />
                </CCol>
              ))}
            </CRow>
          )}
        </section>
        {colors('wrapperColor', 'Wrapper Color', 'Wrapper Colors')}
      </section>
    )
  }
  if (builderType === 'GIFT') {
    const text = optionOf(options, 'personalText')
    return (
      <section className="mt-4" aria-label="Category options">
        <h3>Options</h3>
        <section className="border rounded p-3 mb-3">
          <h4>Personalized Text</h4>
          <div className="d-flex flex-wrap gap-4 mb-3">
            <Toggle id="personal-text-enabled" label="Enabled" checked={!!text} onChange={(enabled) => enabled ? setOption('personalText', { key: 'personalText', name: 'Personalized Text', type: 'text', required: false, maxLength: 50 }) : removeOption('personalText')} />
            {text && <Toggle id="personal-text-required" label="Required" checked={text.required} onChange={(required) => setOption('personalText', { ...text, required })} />}
          </div>
          {text && (
            <>
              <CFormLabel htmlFor="personal-text-max-length">Maximum length</CFormLabel>
              <CFormInput id="personal-text-max-length" type="number" min="1" max="10000" step="1" value={text.maxLength ?? ''} onChange={(event) => setOption('personalText', { ...text, maxLength: event.target.value })} />
            </>
          )}
        </section>
        {colors('color', 'Color', 'Colors')}
      </section>
    )
  }
  return null
}

SelectValuesEditor.propTypes = { title: PropTypes.string.isRequired, values: PropTypes.array.isRequired, onChange: PropTypes.func.isRequired }
ColorValuesEditor.propTypes = { title: PropTypes.string.isRequired, values: PropTypes.array.isRequired, onChange: PropTypes.func.isRequired }
Toggle.propTypes = { id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, checked: PropTypes.bool.isRequired, onChange: PropTypes.func.isRequired }
CategoryOptionsEditor.propTypes = { builderType: PropTypes.string.isRequired, options: PropTypes.array.isRequired, onChange: PropTypes.func.isRequired }

export default CategoryOptionsEditor
