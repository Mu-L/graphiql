import type { Mock } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { formatQuery, HistoryItem } from '../components';
import { HistoryStore } from '../context';
import { Tooltip, GraphiQLProvider, useGraphiQL } from '@graphiql/react';

vi.mock('@graphiql/react', async () => {
  const originalModule = await vi.importActual('@graphiql/react');
  const mockedSetQueryEditor = vi.fn();
  const mockedSetVariableEditor = vi.fn();
  const mockedSetHeaderEditor = vi.fn();
  return {
    ...originalModule,
    useGraphiQL() {
      return {
        queryEditor: { setValue: mockedSetQueryEditor },
        variableEditor: { setValue: mockedSetVariableEditor },
        headerEditor: { setValue: mockedSetHeaderEditor },
        tabs: [],
        storage: {
          get() {},
        },
      };
    },
  };
});

const mockQuery = /* GraphQL */ `
  query Test($string: String) {
    test {
      hasArgs(string: $string)
    }
  }
`;

const mockVariables = JSON.stringify({ string: 'string' });

const mockHeaders = JSON.stringify({ foo: 'bar' });

const mockOperationName = 'Test';

type QueryHistoryItemProps = ComponentProps<typeof HistoryItem>;

const QueryHistoryItemWithContext: typeof HistoryItem = props => {
  return (
    <Tooltip.Provider>
      <GraphiQLProvider fetcher={vi.fn()}>
        <HistoryStore>
          <HistoryItem {...props} />
        </HistoryStore>
      </GraphiQLProvider>
    </Tooltip.Provider>
  );
};

const baseMockProps: QueryHistoryItemProps = {
  item: {
    query: mockQuery,
    variables: mockVariables,
    headers: mockHeaders,
    favorite: false,
  },
};

function getMockProps(
  customProps?: Partial<QueryHistoryItemProps>,
): QueryHistoryItemProps {
  return {
    ...baseMockProps,
    ...customProps,
    item: { ...baseMockProps.item, ...customProps?.item },
  };
}

describe('QueryHistoryItem', () => {
  const { queryEditor, variableEditor, headerEditor } = useGraphiQL(
    state => state,
  );
  const mockedSetQueryEditor = queryEditor!.setValue as Mock;
  const mockedSetVariableEditor = variableEditor!.setValue as Mock;
  const mockedSetHeaderEditor = headerEditor!.setValue as Mock;

  beforeEach(() => {
    mockedSetQueryEditor.mockClear();
    mockedSetVariableEditor.mockClear();
    mockedSetHeaderEditor.mockClear();
  });

  it('renders operationName if label is not provided', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const props = getMockProps(otherMockProps);
    const { container } = render(<QueryHistoryItemWithContext {...props} />);
    expect(
      container.querySelector('button.graphiql-history-item-label')!
        .textContent,
    ).toBe(mockOperationName);
  });

  it('renders a string version of the query if label or operation name are not provided', () => {
    const { container } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    expect(
      container.querySelector('button.graphiql-history-item-label')!
        .textContent,
    ).toBe(formatQuery(mockQuery));
  });

  it('selects the item when history label button is clicked', () => {
    const otherMockProps = { item: { operationName: mockOperationName } };
    const mockProps = getMockProps(otherMockProps);
    const { container } = render(
      <QueryHistoryItemWithContext {...mockProps} />,
    );
    fireEvent.click(
      container.querySelector('button.graphiql-history-item-label')!,
    );
    expect(mockedSetQueryEditor).toHaveBeenCalledTimes(1);
    expect(mockedSetQueryEditor).toHaveBeenCalledWith(mockProps.item.query);
    expect(mockedSetVariableEditor).toHaveBeenCalledTimes(1);
    expect(mockedSetVariableEditor).toHaveBeenCalledWith(
      mockProps.item.variables,
    );
    expect(mockedSetHeaderEditor).toHaveBeenCalledTimes(1);
    expect(mockedSetHeaderEditor).toHaveBeenCalledWith(mockProps.item.headers);
  });

  it('renders label input if the edit label button is clicked', () => {
    const { container, getByLabelText } = render(
      <QueryHistoryItemWithContext {...getMockProps()} />,
    );
    fireEvent.click(getByLabelText('Edit label'));
    expect(container.querySelectorAll('li.editable').length).toBe(1);
    expect(container.querySelectorAll('input').length).toBe(1);
    expect(
      container.querySelectorAll('button.graphiql-history-item-label').length,
    ).toBe(0);
  });
});
