import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'; //These lines import third-party network communication tools from @tanstack/react-query, an internal pre-configured Axios connection file named apiClient, and data layout blueprints labeled as type.
import { apiClient } from '../lib';
import type { ApiResponse, PaginatedData } from '../types';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'; //n your main dashboard page, when you created state memory using useState<AppointmentStatus | ''>(''), your page looked at this line to know exactly what words are legally allowed inside that memory slot.

export interface Appointment { //An Interface rulebook defining the exact keys a complete appointment object contains when coming out of your SQL/NoSQL database. The ? symbol next to doctorId means "optional," and | null means it can explicitly be empty.
  //When your main page loops through records using appointments.map((appointment) => ...), it uses this blueprint. It allows you to safely type appointment.patientName or appointment.patientPhone without your editor showing code errors.
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId?: string | null;
  serviceId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
}

export interface AppointmentFormValues {
  //This defines your empty form baseline variable: const emptyAppointmentForm: AppointmentFormValues. It ensures that every input box in the registration popup accurately aligns with a required backend field.
  doctorId: string;
  serviceId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

export interface AppointmentQueryParams {
  //An interface layout detailing what criteria parameters can be attached to a search operation.
  page: number;
  limit: number;
  status?: AppointmentStatus | '';
  appointmentDate?: string;
}

export interface ServiceOption {
  //Description: An interface describing how a dental service record (like a Root Canal or Scale & Polish treatment profile) must look.
  //Connection to Appointments Page: Used to optimize your services dropdown menu. When your page maps options inside the <SelectInput>, it relies on this blueprint to access service.id and service.name.
  id: string;
  name: string;
  basePrice: string;
  isActive: boolean;
}

const cleanAppointmentPayload = (values: AppointmentFormValues) => ({ //Description: A utility function that takes form inputs, uses the spread operator ...values to duplicate them, and targets the notes property using .trim() || undefined.
  ...values,
  notes: values.notes.trim() || undefined,
});

export const appointmentStatuses: AppointmentStatus[] = [
  //A physical JavaScript array containing the five valid status tracking string keywords.
  //Connection to Appointments Page: Used directly inside your filter panel row on lines 263-267: {appointmentStatuses.map((appointmentStatus) => ...)}. It loops through this array to instantly print the clickable options inside your filtering dropdown menu.
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
];

export interface AppointmentQueryParamsExtended extends AppointmentQueryParams {
  search?: string;
}

export const useAppointmentsQuery = ({
  page,
  limit,
  status,
  appointmentDate,
  search,
}: AppointmentQueryParams & { search?: string }) => {
  return useQuery({
    queryKey: ['appointments-management', page, limit, status, appointmentDate, search],
    queryFn: async () => {
      //queryFn: The asynchronous payload retriever that uses apiClient.get to make a network GET request to /appointment
      //<ApiResponse<PaginatedData<Appointment>>> ? IT just a Nested TypeScript Generic Rule. It tells your auto-complete and compiler exactly what shape of data will come back from the server:
      //ApiResponse<...>: The outermost wrapper defining the standard message envelope your server sends back (which usually includes a status code and a .data container).
      const response = await apiClient.get<ApiResponse<PaginatedData<Appointment>>>(
        '/appointments',
        {
          //it is wherefrontend filters are attached as query parameters to the backend U     RL (making it look like /appointments?page=1&limit=8).
          //status: status || undefined: The double pipeline || is a Logical OR Operator. It means: "If status is an empty string, turn it into undefined." When it is undefined, React Query completely removes it from the internet packet instead of sending an empty string, which keeps your backend from getting confused.
          //sortBy: 'appointmentDate' and sortOrder: 'asc': These are hardcoded instructions sent to your backend database saying: "Always organize this list by the appointment date, from the earliest time to the latest time (ascending)."
          params: {
            page,
            limit,
            status: status || undefined,
            appointmentDate: appointmentDate || undefined,
            sortBy: 'appointmentDate',
            sortOrder: 'asc',
          },
        }
      );

      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useStaffServicesQuery = () => {
  return useQuery({
    queryKey: ['staff-services'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PaginatedData<ServiceOption>>>(
        '/services',
        {
          params: { page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' },
        }
      );
      //A lookup fetch query pulling dental treatments from your /services server endpoint. The .filter((service) => service.isActive) keeps only active medical procedures.
      return response.data.data.items.filter((service) => service.isActive);
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient(); //main manager tool. It gives this function permission to change or erase saved appointment lists later on when a new appointment is added.

  //mutationFn is the core execution action. apiClient.post sends a network payload to the server. cleanAppointmentPayload(values) takes your form inputs and formats them perfectly for the database.
  return useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      const response = await apiClient.post<ApiResponse<Appointment>>(
        '/appointments',
        cleanAppointmentPayload(values)
      );
      return response.data.data;
    },
    onSuccess: () => {
      //invalidateQueries targeting queryKey flags old data as expired. Function: This clears out the old appointments list and the main dashboard stats from your browser's temporary memory cache.
      queryClient.invalidateQueries({ queryKey: ['appointments-management'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<ApiResponse<{ id: string }>>(`/appointments/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-management'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const response = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}`, {
        status,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments-management'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
//Description: Invokes useMutation. The object { id, status } uses object destructuring to accept an appointment's ID string and its new target status keyword.
//Function: It prepares a background process to modify an item, demanding an ID to identify the row and a status code (like 'confirmed') to apply.
//Usage: Activated when a staff member changes a patient's status from 'pending' to 'confirmed' inside your management table.