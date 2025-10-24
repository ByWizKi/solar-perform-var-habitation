import { formatEnergy, formatPower, cn } from '@/lib/utils'

describe('Utils', () => {
  describe('formatEnergy', () => {
    it('formate correctement les valeurs en Wh', () => {
      expect(formatEnergy(500)).toBe('500 Wh')
      expect(formatEnergy(999)).toBe('999 Wh')
    })

    it('formate correctement les valeurs en kWh', () => {
      expect(formatEnergy(1000)).toBe('1.00 kWh')
      expect(formatEnergy(5500)).toBe('5.50 kWh')
      expect(formatEnergy(999999)).toBe('1000.00 kWh')
    })

    it('formate correctement les valeurs en MWh', () => {
      expect(formatEnergy(1000000)).toBe('1.00 MWh')
      expect(formatEnergy(5500000)).toBe('5.50 MWh')
    })

    it('formate correctement les valeurs en GWh', () => {
      expect(formatEnergy(1000000000)).toBe('1.00 GWh')
      expect(formatEnergy(2500000000)).toBe('2.50 GWh')
    })

    it('gre la valeur 0', () => {
      expect(formatEnergy(0)).toBe('0 Wh')
    })
  })

  describe('formatPower', () => {
    it('formate correctement les valeurs en W', () => {
      expect(formatPower(500)).toBe('500 W')
      expect(formatPower(999)).toBe('999 W')
    })

    it('formate correctement les valeurs en kW', () => {
      expect(formatPower(1000)).toBe('1.00 kW')
      expect(formatPower(5500)).toBe('5.50 kW')
    })

    it('formate correctement les valeurs en MW', () => {
      expect(formatPower(1000000)).toBe('1.00 MW')
      expect(formatPower(2500000)).toBe('2.50 MW')
    })

    it('gre la valeur 0', () => {
      expect(formatPower(0)).toBe('0 W')
    })
  })

  describe('cn (classNames utility)', () => {
    it('combine plusieurs classes', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('gre les classes conditionnelles', () => {
      const result = cn('base', { conditional: true, notApplied: false })
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('notApplied')
    })

    it('ignore les valeurs falsy', () => {
      const result = cn('class1', null, undefined, false, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })
  })
})
