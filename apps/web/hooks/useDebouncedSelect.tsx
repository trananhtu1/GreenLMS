import { DefaultOptionType } from "antd/es/select";
import { debounce, get } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Control, useController } from "react-hook-form";
import Loading from "../components/common/Loading";
import { CustomResponse, Pagination } from "../libs/common";

interface UseDebouncedSelectProps<T> {
  name: string;
  control: Control<any>;
  useGetDataQuery: any;
  queryArgs?: Record<string, any>;
  debounceTimeout?: number;
  pageSize?: number;
  selectProps?: Record<string, any>;
  initialOptions?: DefaultOptionType[];
  fetchOnFocus?: boolean;
  labelField?: string;
  valueField?: string;
}

export const useDebouncedSelect = <T extends Record<string, any>>({
  name,
  control,
  useGetDataQuery,
  queryArgs = {},
  debounceTimeout = 500,
  pageSize = 10,
  selectProps = {},
  initialOptions = [],
  fetchOnFocus = true,
  labelField = "name",
  valueField = "id",
}: UseDebouncedSelectProps<T>) => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [options, setOptions] = useState<DefaultOptionType[]>(initialOptions);
  const [isInitialFocusFetchDone, setIsInitialFocusFetchDone] =
    useState(!fetchOnFocus);
  const isFetchingNextPage = useRef(false);

  const { field, fieldState } = useController({ name, control });

  const skipQuery = !debouncedSearchTerm && !isInitialFocusFetchDone;

  const {
    data: apiResponse,
    isFetching,
    isLoading,
    isError,
    error,
  } = useGetDataQuery(
    {
      page,
      limit: pageSize,
      search: debouncedSearchTerm,
      ...queryArgs,
    },
    {
      skip: skipQuery,
      refetchOnMountOrArgChange: true,
    },
  );

  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
      setPage(1);
      setOptions(initialOptions ?? []);
      isFetchingNextPage.current = false;
    }, debounceTimeout),
    [debounceTimeout],
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const { options: transformedOptions, hasNextPage } = useMemo(() => {
    if (!apiResponse) {
      return { options: [], hasNextPage: false };
    }
    try {
      const response = apiResponse as CustomResponse<Pagination<T[]>>;
      const dataItems = response.data.items;

      const options: DefaultOptionType[] = dataItems.map((item: T) => ({
        label: get(item, labelField),
        value: get(item, valueField),
      }));

      const hasNextPage =
        response.data.page * response.data.limit < response.data.total;

      return { options, hasNextPage };
    } catch (e) {
      console.error("Error transforming API response:", e);
      return { options: [], hasNextPage: false };
    }
  }, [apiResponse, labelField, valueField]);

  useEffect(() => {
    if (transformedOptions.length > 0) {
      if (page === 1) {
        // Keep initialOptions at the top and add unique new options from API
        const existingValues = new Set(initialOptions.map((opt) => opt.value));
        const uniqueNewOptions = transformedOptions.filter(
          (opt) => !existingValues.has(opt.value),
        );
        setOptions([...initialOptions, ...uniqueNewOptions]);
      } else {
        setOptions((prevOptions) => {
          const existingValues = new Set(prevOptions.map((opt) => opt.value));
          const newUniqueOptions = transformedOptions.filter(
            (opt) => !existingValues.has(opt.value),
          );
          return [...prevOptions, ...newUniqueOptions];
        });
      }
      isFetchingNextPage.current = false;
    }

    if (!isFetching) {
      isFetchingNextPage.current = false;
    }
  }, [transformedOptions, page, isFetching, isLoading]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSetSearch(value);
  };

  const handleFocus = () => {
    if (
      fetchOnFocus &&
      !isInitialFocusFetchDone &&
      options.length === (initialOptions?.length || 0)
    ) {
      setIsInitialFocusFetchDone(true);
    }
    selectProps.onFocus?.();
  };

  const handleChange = (value: any, option: any) => {
    field.onChange(value);
    selectProps.onChange?.(value, option);
  };

  const handlePopupScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const isNearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 10;

    if (
      isNearBottom &&
      hasNextPage &&
      !isFetching &&
      !isFetchingNextPage.current
    ) {
      isFetchingNextPage.current = true;
      setPage((prevPage) => prevPage + 1);
    }

    selectProps.onPopupScroll?.(event);
  };

  const getNotFoundContent = useCallback(() => {
    if (isLoading || (isFetching && page === 1)) {
      return (
        <div style={{ padding: "8px", textAlign: "center" }}>
          <Loading /> Searching...
        </div>
      );
    }
    if (isError) {
      return (
        <div style={{ padding: "8px", textAlign: "center", color: "red" }}>
          Error: {error?.message || "Failed to fetch data"}
        </div>
      );
    }
    if (
      !isFetching &&
      options.length === 0 &&
      (debouncedSearchTerm || isInitialFocusFetchDone)
    ) {
      return (
        <div style={{ padding: "8px", textAlign: "center" }}>No data found</div>
      );
    }
    if (!isInitialFocusFetchDone && options.length === 0) {
      return (
        <div style={{ padding: "8px", textAlign: "center", color: "#aaa" }}>
          Type to search or focus to load initial items
        </div>
      );
    }
    return null;
  }, [
    isLoading,
    isFetching,
    page,
    isError,
    error?.message,
    options.length,
    debouncedSearchTerm,
    isInitialFocusFetchDone,
  ]);

  const dropdownRender = useCallback(
    (menu: React.ReactElement) => (
      <>
        {menu}
        {isFetching && page > 1 && (
          <div style={{ padding: "8px", textAlign: "center" }}>
            <Loading /> Loading more...
          </div>
        )}
        {!hasNextPage && options.length > 0 && page > 1 && (
          <div style={{ padding: "8px", textAlign: "center", color: "#aaa" }}>
            End of list
          </div>
        )}
      </>
    ),
    [isFetching, page, hasNextPage, options.length],
  );

  return useMemo(
    () => ({
      selectProps: {
        ...selectProps,
        options: options,
        value: field.value,
        loading: isLoading || (isFetching && page === 1),
        showSearch: true,
        filterOption: false,
        onSearch: handleSearch,
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: field.onBlur,
        onPopupScroll: handlePopupScroll,
        notFoundContent: getNotFoundContent(),
        dropdownRender: dropdownRender,
        searchValue: searchTerm,
        allowClear: true,
        placeholder: selectProps.placeholder || "Select or search...",
        ref: field.ref,
      },
      fieldState,
      isLoading: isLoading || isFetching,
      isError,
      error,
      options,
      hasNextPage,
    }),
    [
      selectProps,
      options,
      field.value,
      field.onBlur,
      field.ref,
      isLoading,
      isFetching,
      page,
      handleSearch,
      handleChange,
      handleFocus,
      handlePopupScroll,
      getNotFoundContent,
      dropdownRender,
      searchTerm,
      fieldState,
      isError,
      error,
      hasNextPage,
    ],
  );
};
