import { renderHook, waitFor } from '@testing-library/react';
import { useDispatchesList } from './useDispatchesList';
import { FilterOptions } from '../types';

describe('useDispatchesList', () => {
  const mockFilters: FilterOptions = {
    campanhas: [],
    statuses: [],
    dataInicio: new Date('2026-06-01'),
    dataFim: new Date('2026-06-30'),
    busca: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar estado inicial', () => {
    const { result } = renderHook(() => useDispatchesList(mockFilters));

    expect(result.current.dispatches).toBeDefined();
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('deve ter função refetch', () => {
    const { result } = renderHook(() => useDispatchesList(mockFilters));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('deve aceitar filtros', () => {
    const filteredOptions: FilterOptions = {
      ...mockFilters,
      campanhas: ['prospeccao'],
      busca: 'test',
    };

    const { result } = renderHook(() => useDispatchesList(filteredOptions));

    expect(result.current.dispatches).toEqual([]);
  });

  it('deve permitir atualizar filtros', () => {
    const { result, rerender } = renderHook(
      ({ filters }: { filters: FilterOptions }) => useDispatchesList(filters),
      { initialProps: { filters: mockFilters } }
    );

    const newFilters: FilterOptions = {
      ...mockFilters,
      busca: 'novo',
    };

    rerender({ filters: newFilters });

    expect(result.current.dispatches).toEqual([]);
  });

  it('deve ter propriedade error', () => {
    const { result } = renderHook(() => useDispatchesList(mockFilters));

    expect('error' in result.current).toBe(true);
  });
});
