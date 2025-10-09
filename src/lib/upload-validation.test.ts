import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  validateFile, 
  validateExcelContent, 
  validateCSVContent, 
  validatePythonScript, 
  uploadValidationSchemas 
} from './upload-validation'

describe('Upload Validation', () => {
  describe('validateFile', () => {
    it('should validate Excel files correctly', () => {
      // Arrange
      const validExcelFile = new File(['mock excel content'], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Act
      const result = validateFile(validExcelFile)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('data.xlsx')
        expect(result.data.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      }
    })

    it('should validate CSV files correctly', () => {
      // Arrange
      const validCSVFile = new File(['col1,col2\nval1,val2'], 'data.csv', {
        type: 'text/csv'
      })

      // Act
      const result = validateFile(validCSVFile)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('data.csv')
        expect(result.data.type).toBe('text/csv')
      }
    })

    it('should validate Python files correctly', () => {
      // Arrange
      const validPythonFile = new File(['print(\"Hello World\")'], 'script.py', {
        type: 'text/x-python'
      })

      // Act
      const result = validateFile(validPythonFile)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should reject files that are too large', () => {
      // Arrange
      const largeFile = new File([new ArrayBuffer(100 * 1024 * 1024 + 1)], 'huge.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      // Act
      const result = validateFile(largeFile)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('File size must be less than 100MB')
      }
    })

    it('should reject files with invalid extensions', () => {
      // Arrange
      const invalidFile = new File(['content'], 'malicious.exe', {
        type: 'application/x-msdownload'
      })

      // Act
      const result = validateFile(invalidFile)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid file type')
      }
    })

    it('should reject files with dangerous names', () => {
      // Arrange
      const dangerousFile = new File(['content'], '../../../etc/passwd.csv', {
        type: 'text/csv'
      })

      // Act
      const result = validateFile(dangerousFile)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid filename')
      }
    })

    it('should reject empty files', () => {
      // Arrange
      const emptyFile = new File([''], 'empty.csv', {
        type: 'text/csv'
      })

      // Act
      const result = validateFile(emptyFile)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('File cannot be empty')
      }
    })
  })

  describe('validateExcelContent', () => {
    it('should validate Excel content with required columns', () => {
      // Arrange
      const excelData = [
        {
          'Time Period': new Date(),
          'Timeblock': 1,
          'DAM Price': 100.5,
          'State': 'Active'
        },
        {
          'Time Period': new Date(),
          'Timeblock': 2,
          'DAM Price': 105.0,
          'State': 'Active'
        }
      ]

      // Act
      const result = validateExcelContent(excelData)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data[0]).toHaveProperty('timeblock')
        expect(result.data[0]).toHaveProperty('dam_price')
      }
    })

    it('should handle missing optional columns gracefully', () => {
      // Arrange
      const minimalData = [
        {
          'Time Period': new Date(),
          'Timeblock': 1,
          'DAM Price': 100.5
        }
      ]

      // Act
      const result = validateExcelContent(minimalData)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data[0].state).toBeUndefined()
        expect(result.data[0].plant_name).toBeUndefined()
      }
    })

    it('should reject data with invalid timeblock values', () => {
      // Arrange
      const invalidData = [
        {
          'Time Period': new Date(),
          'Timeblock': 99, // Invalid - should be 1-48
          'DAM Price': 100.5
        }
      ]

      // Act
      const result = validateExcelContent(invalidData)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Timeblock must be between 1 and 48')
      }
    })
  })

  // Note: Additional test cases would be implemented for CSV validation, Python script validation, etc.
  // For brevity, implementing core test structure only
  
  describe('uploadValidationSchemas', () => {
    it('should have schemas for all supported file types', () => {
      // Assert
      expect(uploadValidationSchemas).toHaveProperty('file')
      expect(uploadValidationSchemas).toHaveProperty('excelContent')
      expect(uploadValidationSchemas).toHaveProperty('csvContent')
      expect(uploadValidationSchemas).toHaveProperty('pythonScript')
    })
  })
})
</function_results>

Now let me run the tests to make sure they work correctly:

<function_calls>
<invoke name="run_command">
<parameter name="command">npm test -- --run --reporter=verbose