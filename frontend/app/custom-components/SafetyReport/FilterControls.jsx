"use client";
import React from 'react';
import { ListFilter, ArrowUpDown, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

/**
 * Component for filtering and sorting safety reports
 */
export default function FilterControls({
  statusFilter,
  ordering,
  onStatusFilterChange,
  onOrderingChange,
  onClearFilters
}) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Status filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 border-gray-700 bg-black hover:bg-gray-800 hover:text-white">
              <ListFilter className="h-3.5 w-3.5" />
              <span>Status</span>
              {statusFilter && (
                <Badge variant="secondary" className="ml-1 rounded-sm px-1">
                  {statusFilter === "pending" && "Pending"}
                  {statusFilter === "approved" && "Approved"}
                  {statusFilter === "rejected" && "Rejected"}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-0 bg-black text-white" align="start">
            <div className="p-2">
              <div className="space-y-1">
                <Button
                  variant={statusFilter === "" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onStatusFilterChange("")}
                >
                  All Reports
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onStatusFilterChange("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === "approved" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onStatusFilterChange("approved")}
                >
                  Approved
                </Button>
                <Button
                  variant={statusFilter === "rejected" ? "default" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onStatusFilterChange("rejected")}
                >
                  Rejected
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort order control */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 bg-black text-white border-gray-700 hover:bg-gray-800 hover:text-white">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>
                {ordering === "-created_at" ? "Newest First" : "Oldest First"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-black border border-gray-700 text-white">
            <DropdownMenuItem
              onClick={() => onOrderingChange("-created_at")}
              className={`text-white hover:bg-gray-800 hover:cursor-pointer ${ordering === "-created_at" ? "bg-gray-800" : ""}`}
            >
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onOrderingChange("created_at")}
              className={`text-white hover:bg-gray-800 hover:cursor-pointer ${ordering === "created_at" ? "bg-gray-800" : ""}`}
            >
              Oldest First
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Show filter badge/clear button if filters applied */}
        {(statusFilter || ordering !== "-created_at") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onClearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}