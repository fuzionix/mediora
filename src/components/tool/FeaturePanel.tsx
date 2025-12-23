import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function FeaturePanel() {
    const features = [
      'No data sent to servers',
      'Free and open source',
      'Unlimited file conversions',
      'No file size limits'
    ]

    return (
      <Card className="mt-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    )
}