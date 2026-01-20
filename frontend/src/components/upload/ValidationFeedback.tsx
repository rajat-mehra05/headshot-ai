import { CheckCircle, XCircle, AlertCircle, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ValidationResult } from '@/lib/api'

type ValidationFeedbackProps = {
  result: ValidationResult
}

export function ValidationFeedback({ result }: ValidationFeedbackProps) {
  const { passed, errors, suggestions, quality_score } = result

  return (
    <Card className={cn(passed ? 'border-green-500/50' : 'border-destructive/50')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {passed ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">Image Validated</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-destructive">Validation Failed</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {quality_score !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Quality Score</span>
            <span
              className={cn(
                'font-medium',
                quality_score >= 80
                  ? 'text-green-600'
                  : quality_score >= 50
                  ? 'text-yellow-600'
                  : 'text-destructive'
              )}
            >
              {quality_score}/100
            </span>
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Issues Found
            </h4>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-destructive"
                >
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5 text-yellow-600">
              <Lightbulb className="h-4 w-4" />
              Suggestions
            </h4>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-yellow-500"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {passed && errors.length === 0 && suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Your photo meets all requirements and is ready for headshot generation.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
