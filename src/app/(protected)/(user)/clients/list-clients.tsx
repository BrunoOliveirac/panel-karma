"use client";

import PaginationControls from "@/components/global/pagination-controls";
import Swal from "sweetalert2";
import UserAvatar from "@/components/global/user-avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Client } from "@/lib/models/client";
import { useModal } from "@/lib/providers/modal-provider";
import { ClientService } from "@/lib/services/client.service";
import { useAppStore } from "@/lib/store/use-title-store";
import { FormatCurrency } from "@/lib/utils/set-currency";
import { PackageOpenIcon, Search, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UpsertClient from "./upsert-client";
import { toast } from "sonner";

export default function ListClients() {
  const pageSize = 10;
  const router = useRouter();
  const isFirstLoad = useRef(true);
  const { openModal } = useModal();
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const t = useTranslations("list_clients");
  const [loading, setLoading] = useState(false);
  const setTitle = useAppStore((state) => state.setTitle);
  const [mainClients, setMainClients] = useState<Client[]>([]);
  const clientService = useMemo(() => new ClientService(), []);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { name: t("all_clients"), id: "all" },
    { name: t("favorites"), id: "favorite" },
  ];

  const filteredClients = useMemo(() => {
    let clients = mainClients;
    const term = search.trim().toLowerCase();

    if (selectedCategory === "favorite") {
      clients = clients.filter((client) => client.favorite);
    }

    if (search) {
      clients = clients.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.notes?.toLowerCase().includes(term),
      );
    }

    return clients;
  }, [mainClients, search, selectedCategory]);

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClients.slice(start, start + pageSize);
  }, [filteredClients, page, pageSize]);

  /**
   * Open the upsert client modal.
   * @param client The client to edit.
   * @param index The index of the client in the list.
   */
  const openUpsertClientModal = useCallback(
    async (client?: Client): Promise<void> => {
      if (client && !isFirstLoad.current) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("client", client.id);
        router.push(`?${params.toString()}`);
      }

      const newClient = (await openModal(UpsertClient, {
        client,
      })) as unknown as Client;

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("client");
      router.push(`?${newParams.toString()}`);

      if (!newClient) return;

      if (client) {
        const index = mainClients.findIndex((c) => c.id === client.id);
        if (index < 0) return;

        setMainClients((clients) => {
          const newClients = [...clients];
          newClients[index] = newClient;
          return newClients;
        });
      } else {
        setMainClients(
          [newClient, ...mainClients].sort((prev, next) =>
            prev.name.localeCompare(next.name),
          ),
        );
      }
    },
    [mainClients, openModal, router, searchParams],
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setTitle(t("client_list"));
        const clients = await clientService.getAllClients();
        setMainClients(clients);
        const client = searchParams.get("client");

        if (client) {
          const clientIndex = clients.findIndex((c) => c.id === client);
          openUpsertClientModal(clients[clientIndex]);
        }

        isFirstLoad.current = false;
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (!isFirstLoad.current) return;
    loadData();
  }, [clientService, openUpsertClientModal, searchParams, setTitle, t]);

  /**
   * Toggle the selected category, reseting the filter and filtering the clients.
   * @param categoryId The id of the category to toggle.
   */
  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  /**
   * Toggle the favorite status of a client.
   * @param client The client to toggle the favorite status.
   */
  const toggleFavorite = async (client: Client) => {
    try {
      setMainClients((clients) =>
        clients.map((prevClient) =>
          prevClient.id === client.id
            ? { ...prevClient, favorite: !client.favorite }
            : prevClient,
        ),
      );

      await clientService.toggleFavorite(client.id, !client.favorite);
      toast.success(t(`client_${!client.favorite ? "" : "un"}favorited`));
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${!client.favorite ? "" : "un"}favorite`));
    }
  };

  /**
   * Delete a client.
   * @param client The client to delete.
   */
  const deleteClient = async (client: Client) => {
    try {
      const response = await Swal.fire({
        title: t("are_you_sure"),
        text: t("you_wont_be"),
        icon: "warning",
        showCancelButton: true,
        theme: "auto",
        cancelButtonColor: "#d33",
        cancelButtonText: t("cancel"),
        confirmButtonColor: "#3085d6",
        confirmButtonText: t("confirm"),
      });

      if (!response?.isConfirmed) return;

      await clientService.deleteClient(client.id);
      toast.success(t("client_deleted"));
      setMainClients((clients) => clients.filter((c) => c.id !== client.id));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_delete"));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex flex-1 justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_clients")}</p>

        <div className="flex flex-1 justify-end items-center gap-4">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              placeholder={t("search")}
              dataSlot="list-clients-search"
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <button
            data-slot="create-client"
            onClick={() => openUpsertClientModal()}
            className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-8 px-3 rounded-full transition-all place-content-center hover:brightness-90"
          >
            {t("create_client")}
          </button>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3 flex-wrap">
        {categories.map((category) => (
          <button
            key={category.id}
            data-slot={`category-${category.id}`}
            onClick={() => toggleCategory(category.id)}
            className={`${selectedCategory === category.id ? "gradient-border" : ""} text-sm! h-8 px-3 w-max rounded-full! transition-all!`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : !paginatedClients.length ? (
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
          <PackageOpenIcon size={40} strokeWidth="1.5" />
          <p>{t("clients_not_found")}</p>
        </div>
      ) : (
        <>
          <ClientList
            clients={paginatedClients}
            deleteClient={deleteClient}
            toggleFavorite={toggleFavorite}
            handleUpdateClientModal={openUpsertClientModal}
          />

          {filteredClients.length ? (
            <div className="shrink-0">
              <PaginationControls
                page={page}
                onPageChange={setPage}
                totalPages={Math.ceil(filteredClients.length / pageSize)}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ClientList({
  clients,
  deleteClient,
  toggleFavorite,
  handleUpdateClientModal,
}: {
  clients: Client[];
  deleteClient: (client: Client) => void;
  toggleFavorite: (client: Client) => void;
  handleUpdateClientModal: (client: Client) => void;
}) {
  const t = useTranslations("list_clients");

  /**
   * Toggle the favorite status of a client, emmiting the event to the parent.
   * @param e The event.
   * @param client The client to toggle the favorite status.
   */
  const handleToggleFavorite = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    client: Client,
  ) => {
    e.stopPropagation();
    toggleFavorite(client);
  };

  /**
   * Delete a client, emmiting the event to the parent.
   * @param e The event.
   * @param client The client to delete.
   */
  const handleDeleteClient = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    client: Client,
  ) => {
    e.stopPropagation();
    deleteClient(client);
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-4 px-1">
        {clients.map((client) => (
          <Card
            id={client.id}
            key={client.id}
            data-slot="client-card"
            onClick={() => handleUpdateClientModal(client)}
            className="cursor-pointer transition-all hover:shadow-lg hover:shadow-primary/25 hover:z-10 group"
          >
            <CardContent>
              <div className="flex justify-evenly items-center mb-3">
                <button
                  data-slot={`favorite-client-${client.id}`}
                  onClick={(e) => handleToggleFavorite(e, client)}
                  id={`${client.favorite ? "" : "un"}favorited-client`}
                  className={`border border-transparent rounded-full h-fit p-2 transition-all md:opacity-0 md:group-hover:opacity-100! ${client.favorite ? "hover:border-(--warn) hover:bg-(--warn)/10" : "hover:border-primary"}`}
                >
                  <Image
                    width={20}
                    height={20}
                    alt={client.favorite ? "favorited" : "unfavorited"}
                    src={`/icons/star${client.favorite ? "" : "-outline"}.svg`}
                  />
                </button>

                <UserAvatar size={44} name="client.name" />

                <button
                  data-slot={`delete-client-${client.id}`}
                  onClick={(e) => handleDeleteClient(e, client)}
                  className="border border-transparent rounded-full h-fit p-2 transition-all hover:border-(--danger) md:opacity-0 md:group-hover:opacity-100!"
                >
                  <Trash size={20} className="text-(--danger)" />
                </button>
              </div>

              <p className="text-sm text-center text-black dark:text-white font-medium">
                {client.name}
              </p>

              <p className="text-xs text-center text-gray-700 dark:text-gray-400">
                {client.email}
              </p>

              <Separator className="bg-primary my-3" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="text-xs">
                  <p className="text-black dark:text-white">{t("from")}</p>
                  <p className="text-gray-700 dark:text-gray-300">-</p>
                </div>

                <div className="text-xs">
                  <p className="text-black dark:text-white">{t("sector")}</p>
                  <p className="text-gray-700 dark:text-gray-300">-</p>
                </div>

                <div className="text-xs">
                  <p className="text-black dark:text-white">{t("budget")}</p>

                  <p className="text-gray-700 dark:text-gray-300">
                    {FormatCurrency(client.budget)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-justify text-gray-400 line-clamp-2 mt-3">
                {client.notes}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
