import React from 'react'
import { CProgress } from '@coreui/react'

const ProgressBarComponent = ({ item }) => {
  console.log('item', item)
  const { withTranslation, withoutTranslation } = item
  let totalItems = withoutTranslation + withTranslation
  const withTranslationPercentage = ((withTranslation / totalItems) * 100).toFixed(2)
  const withoutTranslationPercentage = ((withoutTranslation / totalItems) * 100).toFixed(2)

  return (
    <div>
      <div className="mt-3">
        <span>{`Translated: ${withTranslation} of ${totalItems}`}</span>
        <CProgress thin color="success" value={withTranslationPercentage} />
      </div>
      <div className="mt-2">
        <span>{`Not Translated: ${withoutTranslation}`}</span>
        <CProgress thin color="danger" value={withoutTranslationPercentage} />
      </div>
      <div></div>
    </div>
  )
}

export default ProgressBarComponent
