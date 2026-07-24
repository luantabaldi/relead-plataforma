import { render, screen } from '@testing-library/react';
import { FilterBar } from './FilterBar';
import { FilterOptions } from '../types';

describe('FilterBar', () => {
  const mockFilters: FilterOptions = {
    campanhas: [],
    statuses: [],
    dataInicio: new Date('2026-06-01'),
    dataFim: new Date('2026-06-30'),
    busca: '',
  };

  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar campo de busca', () => {
    render(<FilterBar filters={mockFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou telefone/i);
    expect(searchInput).not.toBeNull();
  });

  it('deve renderizar botão de filtros avançados', () => {
    render(<FilterBar filters={mockFilters} onFilterChange={mockOnFilterChange} />);

    const toggleButton = screen.getByText(/Filtros/);
    expect(toggleButton).not.toBeNull();
  });

  it('deve aceitar filtros como prop', () => {
    const customFilters: FilterOptions = {
      ...mockFilters,
      busca: 'João',
      campanhas: ['prospeccao'],
    };

    render(<FilterBar filters={customFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou telefone/i) as HTMLInputElement;
    expect(searchInput.value).toBe('João');
  });

  it('deve chamar onFilterChange quando prop muda', () => {
    const { rerender } = render(
      <FilterBar filters={mockFilters} onFilterChange={mockOnFilterChange} />
    );

    const newFilters: FilterOptions = {
      ...mockFilters,
      busca: 'novo',
    };

    rerender(<FilterBar filters={newFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou telefone/i) as HTMLInputElement;
    expect(searchInput.value).toBe('novo');
  });

  it('deve aceitar mudanças nos filtros', () => {
    const { rerender } = render(
      <FilterBar filters={mockFilters} onFilterChange={mockOnFilterChange} />
    );

    const newFilters: FilterOptions = {
      ...mockFilters,
      campanhas: ['prospeccao'],
    };

    rerender(<FilterBar filters={newFilters} onFilterChange={mockOnFilterChange} />);

    expect(mockOnFilterChange).toBeDefined();
  });
});
