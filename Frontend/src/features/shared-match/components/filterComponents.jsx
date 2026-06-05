import React from "react";
import { Building2, MapPin } from "lucide-react";
import SelectFilter from "../../../components/ui/Filter";

const FilterComponents = ({ branches, courts, filters, setFilters }) => {
  const branchOptions = branches.map((branch) => ({
    label: branch.name,
    value: branch._id,
  }));

  const courtOptions = courts.map((court) => ({
    label: court.name,
    value: court._id,
  }));

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-2 lg:max-w-3xl">
      <SelectFilter
        label={
          <span className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-emerald-700" />
            Chi nhánh
          </span>
        }
        options={branchOptions}
        value={filters.branch_id}
        className="min-w-0"
        onChange={(value) =>
          setFilters((prev) => ({
            ...prev,
            branch_id: value,
          }))
        }
      />

      <SelectFilter
        label={
          <span className="flex items-center gap-2">
            <Building2 size={16} className="shrink-0 text-emerald-700" />
            Sân
          </span>
        }
        options={courtOptions}
        value={filters.court_id}
        className="min-w-0"
        onChange={(value) =>
          setFilters((prev) => ({
            ...prev,
            court_id: value,
          }))
        }
      />
    </div>
  );
};

export default FilterComponents;
