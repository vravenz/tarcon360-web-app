// File: src/pages/AddRosterPage/components/ShiftsComponent.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
import InputField from '../components/InputField';
import DateInput from '../components/DateInput';
import Button from '../components/Button';
import DropdownSelect from './DropdownSelect';

export interface ShiftRecord {
  shift_date: string;  // e.g. "2025-03-15"
  scheduled_start_time: string;  // e.g. "09:00"
  scheduled_end_time: string;    // e.g. "17:00"
  break_time: string;  // e.g. "00:30:00" or ""
}

interface Props {
  onShiftsChange: (shifts: ShiftRecord[]) => void;
  shifts?: ShiftRecord[];             // For edit mode
  disableDateEditing?: boolean;
  disableShiftAddition?: boolean;
  readOnly?: boolean;   
}

const ShiftsComponent: React.FC<Props> = ({
  onShiftsChange,
  shifts: initialShifts,
  disableDateEditing = false,
  disableShiftAddition = false,
  readOnly = false,
}) => {
  // If we have some “initialShifts,” default to “different” mode
  const initialMode: 'same' | 'different' =
    initialShifts && initialShifts.length > 0 ? 'different' : 'same';
  const [shiftType, setShiftType] = useState<'same' | 'different'>(initialMode);

  // State for the “Same Multiple Shifts” approach
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakTime, setBreakTime] = useState('');

  // State for the “Different Multiple Shifts” approach
  const [differentShifts, setDifferentShifts] = useState<ShiftRecord[]>(
    initialShifts && initialShifts.length > 0
      ? initialShifts
      : [{ shift_date: '', scheduled_start_time: '', scheduled_end_time: '', break_time: '' }]
  );

  const breakTimeOptions = [
    { label: 'No Break', value: '00:00:00' },
    { label: '15 min', value: '00:15:00' },
    { label: '30 min', value: '00:30:00' },
    { label: '45 min', value: '00:45:00' },
    { label: '1 hour', value: '01:00:00' },
  ];  

  const handleShiftTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setShiftType(e.target.value as 'same' | 'different');
  };

  /** Build the array of shifts (depending on shiftType) and send up to parent. */
  const generateShiftData = (): ShiftRecord[] => {
    if (shiftType === 'same') {
      // Validate presence of date range
      if (!startDate || !endDate) return [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      const results: ShiftRecord[] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const isoDate = new Date(d).toISOString().split('T')[0];
        results.push({
          shift_date: isoDate,
          scheduled_start_time: startTime || '',
          scheduled_end_time: endTime || '',
          break_time: breakTime || '',
        });
      }
      return results;
    } else {
      // “Different” shifts come directly from user input
      return differentShifts;
    }
  };

  const handleAddShiftRow = () => {
    setDifferentShifts((prev) => [
      ...prev,
      { shift_date: '', scheduled_start_time: '', scheduled_end_time: '', break_time: '' },
    ]);
  };

  const handleChangeShiftRow = (index: number, field: keyof ShiftRecord, value: string) => {
    setDifferentShifts((prev) => {
      const newShifts = [...prev];
      newShifts[index] = { ...newShifts[index], [field]: value };
      return newShifts;
    });
  };

  // Whenever shiftType or any input changes, recalculate & pass to parent
  useEffect(() => {
    onShiftsChange(generateShiftData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftType, startDate, endDate, startTime, endTime, breakTime, differentShifts]);

  useEffect(() => {
    if (initialShifts && initialShifts.length > 0) {
      // Only update if the new initialShifts differ from the current differentShifts
      if (JSON.stringify(differentShifts) !== JSON.stringify(initialShifts)) {
        setDifferentShifts(initialShifts);
        setShiftType('different');
      }
    }
  }, [initialShifts, differentShifts]);
  

  return (
    <div className="p-4 border dark:border-zinc-700 rounded">
      <h3 className="text-lg font-semibold mb-2">Shift Details</h3>

      {/* If there are no prefilled shifts, let the user pick between “same/different” modes */}
      {!initialShifts && (
        <div className="mb-2">
          <label className="mr-4">
            <input
              type="radio"
              name="shiftType"
              value="same"
              className="mr-2"
              checked={shiftType === 'same'}
              onChange={handleShiftTypeChange}
            />
            Same Multiple Shifts
          </label>
          <label>
            <input
              type="radio"
              name="shiftType"
              value="different"
              className="mr-2"
              checked={shiftType === 'different'}
              onChange={handleShiftTypeChange}
            />
            Different Multiple Shifts
          </label>
        </div>
      )}

      {shiftType === 'same' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date:</label>
            <DateInput
              date={startDate ? new Date(startDate) : null}
              onChange={(date) => {
                if (!disableDateEditing && date) {
                  setStartDate(date.toISOString().split('T')[0]);
                }
              }}
              disabled={disableDateEditing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date:</label>
            <DateInput
              date={endDate ? new Date(endDate) : null}
              onChange={(date) => {
                if (!disableDateEditing && date) {
                  setEndDate(date.toISOString().split('T')[0]);
                }
              }}
              disabled={disableDateEditing}
            />
          </div>

          <div>
            <InputField
              type="time"
              name="startTime"
              label="Start Time:"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <InputField
              type="time"
              name="endTime"
              label="End Time:"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Break Time:</label>
            <DropdownSelect
              value={breakTime}
              onChange={setBreakTime}
              options={breakTimeOptions}
              disabled={readOnly}
            />
          </div>
        </div>
      )}

      {shiftType === 'different' && (
        <>
          {differentShifts.map((shift, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 mb-2 p-2 border-b dark:border-zinc-700 last:border-b-0">
              <div>
                <label className="block text-sm font-medium mb-1">Shift Date:</label>
                <DateInput
                  date={shift.shift_date ? new Date(shift.shift_date) : null}
                  onChange={(date) => {
                    if (!disableDateEditing && date) {
                      handleChangeShiftRow(index, 'shift_date', date.toISOString().split('T')[0]);
                    }
                  }}
                  disabled={disableDateEditing}
                />
              </div>
              <div>
                <InputField
                  type="time"
                  name={`startTime-${index}`}
                  label="Start Time:"
                  value={shift.scheduled_start_time}
                  onChange={(e) => handleChangeShiftRow(index, 'scheduled_start_time', e.target.value)}
                />
              </div>
              <div>
                <InputField
                  type="time"
                  name={`endTime-${index}`}
                  label="End Time:"
                  value={shift.scheduled_end_time}
                  onChange={(e) => handleChangeShiftRow(index, 'scheduled_end_time', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Break Time:</label>
                <DropdownSelect
                  value={shift.break_time}
                  onChange={(value) => handleChangeShiftRow(index, 'break_time', value)}
                  options={breakTimeOptions}
                  disabled={readOnly}
                />
              </div>
            </div>
          ))}

          {!disableShiftAddition && (
            <Button
              type="button"
              onClick={handleAddShiftRow}
              size="small"
              variant="outline"
              icon="plus"
              className="mt-3"
              marginRight="5px"
            >
              Add Another Shift
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ShiftsComponent;
