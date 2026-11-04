import { parseAsBoolean, useQueryState } from "nuqs";

const useGlobalSearch = () => {
  const [open, setOpen] = useQueryState(
    "search",
    parseAsBoolean.withDefault(false)
  );
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(null);
  return {
    open,
    setOpen,
    onOpen,
    onClose,
  };
};

export default useGlobalSearch;
